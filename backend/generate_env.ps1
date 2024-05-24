function GenerateRandomPassword {
    $bytes = New-Object Byte[] 24  # Create a 24-byte array
    $rand = New-Object Security.Cryptography.RNGCryptoServiceProvider
    $rand.GetBytes($bytes)  # Fill the array with random bytes
    return [Convert]::ToBase64String($bytes)  # Return the Base64 encoded string
}

$MARIADB_ROOT_PASSWORD = GenerateRandomPassword  # Generate a random password
$MARIADB_PASSWORD = GenerateRandomPassword  # Generate another random password
$SECRET = GenerateRandomPassword  # Generate yet another random password
$ADMIN_PASSWORD = GenerateRandomPassword  # Generate yet another random password

# Create or overwrite the .env file
"MARIADB_ROOT_PASSWORD=$MARIADB_ROOT_PASSWORD" | Out-File -FilePath .env -Encoding UTF8
"MARIADB_PASSWORD=$MARIADB_PASSWORD" | Add-Content -Path .env -Encoding UTF8
"SECRET=$SECRET" | Add-Content -Path .env -Encoding UTF8
"ADMIN_PASSWORD=$ADMIN_PASSWORD" | Add-Content -Path .env -Encoding UTF8

Write-Host ".env file has been created with random passwords."
