# SSH Keys Portal - Quick Start

## Windows
```cmd
make install
make dev
make status
```

## Linux
```bash
make install
make dev
make status
```

## Access
- Backend API: http://localhost:3000
- Frontend App: http://localhost:3001
- API Docs: http://localhost:3000/docs

If `make` is not found, run the platform bootstrap once, then retry the commands:
- Windows (PowerShell): `./bootstrap-windows.bat` or `\.\bootstrap-windows.bat`
- Linux: `chmod +x bootstrap.sh && ./bootstrap.sh`