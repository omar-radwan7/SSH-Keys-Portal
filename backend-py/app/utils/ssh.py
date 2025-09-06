import base64
import hashlib
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import rsa, ed25519, ec
from cryptography.hazmat.primitives import serialization
from cryptography.fernet import Fernet
import secrets
import shutil
import subprocess
import tempfile
import os

SSH_ALGS = {"ssh-rsa", "ssh-ed25519", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521"}

def validate_public_key(pub: str) -> bool:
	parts = pub.strip().split()
	if len(parts) < 2:
		return False
	alg, data = parts[0], parts[1]
	if alg not in SSH_ALGS:
		return False
	try:
		base64.b64decode(data)
		return True
	except Exception:
		return False

def parse_metadata(pub: str) -> Tuple[str, int]:
	alg = pub.strip().split()[0]
	if alg == 'ssh-ed25519':
		return alg, 256
	if alg == 'ssh-rsa':
		return alg, 2048
	if alg == 'ecdsa-sha2-nistp256':
		return alg, 256
	if alg == 'ecdsa-sha2-nistp384':
		return alg, 384
	if alg == 'ecdsa-sha2-nistp521':
		return alg, 521
	return alg, 0

def fingerprint_sha256(pub: str) -> str:
	b64 = pub.strip().split()[1]
	blob = base64.b64decode(b64)
	return hashlib.sha256(blob).hexdigest()

def generate_system_keypair(algorithm: str, bits: int) -> Tuple[str, str]:
	"""Generate SSH key pair.
	- Prefer ssh-keygen to produce native OpenSSH keys (especially for Ed25519)
	- Fallback to cryptography for RSA if ssh-keygen is unavailable
	Returns (public_key_openssh, private_key_contents)
	"""
	ssh_keygen = shutil.which("ssh-keygen")
	comment = "generated@hpc-portal"

	if algorithm == 'ssh-ed25519' and ssh_keygen:
		with tempfile.TemporaryDirectory() as tmp:
			key_path = os.path.join(tmp, "id_ed25519")
			subprocess.run([ssh_keygen, "-t", "ed25519", "-f", key_path, "-N", "", "-C", comment], check=True)
			with open(key_path + ".pub", "r") as f:
				public_key = f.read().strip()
			with open(key_path, "r") as f:
				private_key = f.read()
			return public_key, private_key
	
	if algorithm == 'ssh-rsa' and ssh_keygen:
		if bits < 2048:
			bits = 2048
		with tempfile.TemporaryDirectory() as tmp:
			key_path = os.path.join(tmp, "id_rsa")
			subprocess.run([ssh_keygen, "-t", "rsa", "-b", str(bits), "-f", key_path, "-N", "", "-C", comment], check=True)
			with open(key_path + ".pub", "r") as f:
				public_key = f.read().strip()
			with open(key_path, "r") as f:
				private_key = f.read()
			return public_key, private_key
	
	if algorithm == 'ecdsa-sha2-nistp256' and ssh_keygen:
		with tempfile.TemporaryDirectory() as tmp:
			key_path = os.path.join(tmp, "id_ecdsa")
			subprocess.run([ssh_keygen, "-t", "ecdsa", "-b", "256", "-f", key_path, "-N", "", "-C", comment], check=True)
			with open(key_path + ".pub", "r") as f:
				public_key = f.read().strip()
			with open(key_path, "r") as f:
				private_key = f.read()
			return public_key, private_key
	
	if algorithm == 'ecdsa-sha2-nistp384' and ssh_keygen:
		with tempfile.TemporaryDirectory() as tmp:
			key_path = os.path.join(tmp, "id_ecdsa")
			subprocess.run([ssh_keygen, "-t", "ecdsa", "-b", "384", "-f", key_path, "-N", "", "-C", comment], check=True)
			with open(key_path + ".pub", "r") as f:
				public_key = f.read().strip()
			with open(key_path, "r") as f:
				private_key = f.read()
			return public_key, private_key
	
	if algorithm == 'ecdsa-sha2-nistp521' and ssh_keygen:
		with tempfile.TemporaryDirectory() as tmp:
			key_path = os.path.join(tmp, "id_ecdsa")
			subprocess.run([ssh_keygen, "-t", "ecdsa", "-b", "521", "-f", key_path, "-N", "", "-C", comment], check=True)
			with open(key_path + ".pub", "r") as f:
				public_key = f.read().strip()
			with open(key_path, "r") as f:
				private_key = f.read()
			return public_key, private_key
	
	# Fallbacks
	if algorithm == 'ssh-ed25519':
		# Without ssh-keygen, we can only return PEM private and OpenSSH public; OpenSSH private format unavailable
		priv = ed25519.Ed25519PrivateKey.generate()
		pub = priv.public_key()
		private_pem = priv.private_bytes(
			encoding=serialization.Encoding.PEM,
			format=serialization.PrivateFormat.PKCS8,
			encryption_algorithm=serialization.NoEncryption(),
		).decode()
		public_openssh = pub.public_bytes(
			encoding=serialization.Encoding.OpenSSH,
			format=serialization.PublicFormat.OpenSSH,
		).decode() + f" {comment}"
		return public_openssh, private_pem
	
	# ECDSA fallbacks
	if algorithm == 'ecdsa-sha2-nistp256':
		priv = ec.generate_private_key(ec.SECP256R1())
		pub = priv.public_key()
		private_pem = priv.private_bytes(
			encoding=serialization.Encoding.PEM,
			format=serialization.PrivateFormat.PKCS8,
			encryption_algorithm=serialization.NoEncryption(),
		).decode()
		public_openssh = pub.public_bytes(
			encoding=serialization.Encoding.OpenSSH,
			format=serialization.PublicFormat.OpenSSH,
		).decode() + f" {comment}"
		return public_openssh, private_pem
	
	if algorithm == 'ecdsa-sha2-nistp384':
		priv = ec.generate_private_key(ec.SECP384R1())
		pub = priv.public_key()
		private_pem = priv.private_bytes(
			encoding=serialization.Encoding.PEM,
			format=serialization.PrivateFormat.PKCS8,
			encryption_algorithm=serialization.NoEncryption(),
		).decode()
		public_openssh = pub.public_bytes(
			encoding=serialization.Encoding.OpenSSH,
			format=serialization.PublicFormat.OpenSSH,
		).decode() + f" {comment}"
		return public_openssh, private_pem
	
	if algorithm == 'ecdsa-sha2-nistp521':
		priv = ec.generate_private_key(ec.SECP521R1())
		pub = priv.public_key()
		private_pem = priv.private_bytes(
			encoding=serialization.Encoding.PEM,
			format=serialization.PrivateFormat.PKCS8,
			encryption_algorithm=serialization.NoEncryption(),
		).decode()
		public_openssh = pub.public_bytes(
			encoding=serialization.Encoding.OpenSSH,
			format=serialization.PublicFormat.OpenSSH,
		).decode() + f" {comment}"
		return public_openssh, private_pem
	
	# RSA fallback
	if bits < 2048:
		bits = 2048
	priv = rsa.generate_private_key(public_exponent=65537, key_size=bits)
	pub = priv.public_key()
	private_pem = priv.private_bytes(
		encoding=serialization.Encoding.PEM,
		format=serialization.PrivateFormat.TraditionalOpenSSL,
		encryption_algorithm=serialization.NoEncryption(),
	).decode()
	public_openssh = pub.public_bytes(
		encoding=serialization.Encoding.OpenSSH,
		format=serialization.PublicFormat.OpenSSH,
	).decode() + f" {comment}"
	return public_openssh, private_pem

def encrypt_private_key(private_key_pem: str, encryption_key: str) -> str:
	key = hashlib.sha256(encryption_key.encode()).digest()
	fernet_key = base64.urlsafe_b64encode(key)
	f = Fernet(fernet_key)
	return f.encrypt(private_key_pem.encode()).decode()

def decrypt_private_key(token: str, encryption_key: str) -> str:
	key = hashlib.sha256(encryption_key.encode()).digest()
	fernet_key = base64.urlsafe_b64encode(key)
	f = Fernet(fernet_key)
	return f.decrypt(token.encode()).decode() 