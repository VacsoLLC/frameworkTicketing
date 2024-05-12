function GenerateRandomPassword {
    $bytes = New-Object Byte[] 24  # Create a 24-byte array
    $rand = New-Object Security.Cryptography.RNGCryptoServiceProvider
    $rand.GetBytes($bytes)  # Fill the array with random bytes
    return [Convert]::ToBase64String($bytes)  # Return the Base64 encoded string
}

$MYSQL_ROOT_PASSWORD = GenerateRandomPassword  # Generate a random password
$MYSQL_PASSWORD = GenerateRandomPassword  # Generate another random password
$SECRET = GenerateRandomPassword  # Generate yet another random password
$ADMIN_PASSWORD = GenerateRandomPassword  # Generate yet another random password

# Create or overwrite the .env file
"MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD" | Out-File -FilePath .env -Encoding UTF8
"MYSQL_PASSWORD=$MYSQL_PASSWORD" | Add-Content -Path .env -Encoding UTF8
"SECRET=$SECRET" | Add-Content -Path .env -Encoding UTF8
"ADMIN_PASSWORD=$ADMIN_PASSWORD" | Add-Content -Path .env -Encoding UTF8

Write-Host ".env file has been created with random passwords."
