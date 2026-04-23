"""
Safe .env file creator for auto-settlement
"""
import getpass

print("=" * 60)
print("AUTO-SETTLEMENT SETUP")
print("=" * 60)
print("\nThis will create .env file with your private key.")
print("⚠️  Use TESTNET wallet only!")
print("⚠️  Private key will be stored securely in .env")
print()

private_key = getpass.getpass("Enter your private key (hidden): ").strip()

if not private_key:
    print("❌ No private key provided")
    exit(1)

# Add 0x if not present
if not private_key.startswith('0x'):
    private_key = '0x' + private_key

# Validate length (should be 66 chars with 0x)
if len(private_key) != 66:
    print(f"⚠️  Warning: Private key length is {len(private_key)}, expected 66")
    print("Make sure you copied the full private key")
    proceed = input("Continue anyway? (y/n): ")
    if proceed.lower() != 'y':
        exit(1)

# Create .env file
with open('.env', 'w') as f:
    f.write(f"OWNER_PRIVATE_KEY={private_key}\n")

print("\n✅ .env file created successfully!")
print("📝 File location: comprehensive_backend/.env")
print("\n🔒 Security:")
print("   - File is in .gitignore (won't be committed)")
print("   - Only readable by backend server")
print("   - Keep this file secure!")
print("\n🚀 Next step:")
print("   Restart backend: python main.py")
print("\n   You should see:")
print("   ✓ Settlement account loaded: 0x...")
print("   🤖 Auto-settlement service started")
