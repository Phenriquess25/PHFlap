## Como adicionar o ícone PHFlap

### Passo 1: Salvar a imagem
Salve a imagem PHFlap.png que você enviou no chat em:
```
c:\Users\ResTIC16\Ufal\code\phflap\fa-editor-simulator\build\icon.png
```

### Passo 2: Executar os comandos
Abra o PowerShell e execute:

```powershell
cd c:\Users\ResTIC16\Ufal\code\phflap\fa-editor-simulator

# Rebuild da aplicação
npm run build

# Rebuild do executável com o novo ícone
npx electron-builder --win portable --dir
```

### Passo 3: Criar o ZIP
```powershell
# Deletar ZIP antigo
Remove-Item "release\PHFlap-v1.0.0-Windows-Portable.zip" -ErrorAction SilentlyContinue

# Criar novo ZIP
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\PHFlap-v1.0.0-Windows-Portable.zip" -Force
```

### Resultado
- Executável: `release\win-unpacked\PHFlap.exe` (com ícone PHFlap)
- ZIP: `release\PHFlap-v1.0.0-Windows-Portable.zip`
- Logo aparecendo corretamente dentro da aplicação
