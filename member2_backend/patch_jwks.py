import re

with open('app/services/m6_security_evidence.py', 'r') as f:
    content = f.read()

# Replace the JWK extraction logic
old_jwk_logic = """            rsa_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    break
            
            if not rsa_key:
                raise AuthenticationError('Unknown kid in token')

            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience="authenticated",
                issuer=self.supabase_url
            )"""

new_jwk_logic = """            public_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header.get("kid"):
                    public_key = key
                    break
            
            if not public_key:
                raise AuthenticationError('Unknown kid in token')

            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256", "ES256", "HS256"],
                audience="authenticated",
                issuer=self.supabase_url
            )"""

content = content.replace(old_jwk_logic, new_jwk_logic)

with open('app/services/m6_security_evidence.py', 'w') as f:
    f.write(content)
