from typing import List, Tuple
import hashlib
import os
import paramiko
from ..core.config import settings


def render_authorized_keys(public_keys: List[str], options: str | None = None) -> Tuple[str, str]:
	content_lines = []
	for key in public_keys:
		line = f"{options} {key}" if options else key
		content_lines.append(line)
	content = "\n".join(content_lines) + "\n"
	checksum = hashlib.sha256(content.encode()).hexdigest()
	return content, checksum


def apply_to_host(hostname: str, username: str, authorized_keys_content: str) -> Tuple[bool, str | None]:
	ssh_user = settings.APPLY_SSH_USER
	key_path = os.path.expanduser(settings.APPLY_SSH_KEY_PATH)

	try:
		client = paramiko.SSHClient()
		if settings.APPLY_STRICT_HOST_KEY_CHECK:
			client.load_system_host_keys()
		else:
			client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
		client.connect(hostname, username=ssh_user, key_filename=key_path, timeout=10)

		sftp = client.open_sftp()
		remote_dir = f"/home/{username}/.ssh"
		remote_file = f"{remote_dir}/authorized_keys"
		# Ensure directory exists
		try:
			sftp.stat(remote_dir)
		except FileNotFoundError:
			sftp.mkdir(remote_dir)
			client.exec_command(f"chown {username}:{username} {remote_dir} && chmod 700 {remote_dir}")

		# Write to temp and move atomically
		tmp_path = f"{remote_file}.tmp"
		with sftp.file(tmp_path, 'w') as f:
			f.write(authorized_keys_content)
		client.exec_command(f"chown {username}:{username} {tmp_path} && chmod 600 {tmp_path} && mv {tmp_path} {remote_file}")

		sftp.close(); client.close()
		return True, None
	except Exception as e:
		try:
			client.close()
		except Exception:
			pass
		return False, str(e) 