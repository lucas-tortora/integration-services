---
image: /img/integration-services/logo/integration_services.png
description: The example-4 script authenticates an Integration Service client to manage Identities using the Admin identity created in example-0 and then creates and verifies identities and credentials.
keywords:
- how to
- create identity
- create credential
- validate credential
- add trusted authority
- example
---

# Trusted Authorities

The [example-4](https://github.com/albydeca/iota-is-sdk/blob/main/examples/src/main/java/net/gradbase/examples/TrustedAuthorities.java)
script authenticates an Integration Service client to manage Identities using the Admin identity created in [example-0](how-to-run-examples) and then performs the following tasks:

1. Creates an identity with username: `Driver`.
2. Creates a credential for the `Driver` identity (the root identity is a trusted authority).
3. Verifies a credential issued by this trusted authority.
4. Checks a credential (in the Tangle) that is issued by an unknown authority (it will be not valid). 
5. Adds the external issuer as trusted authority.
6. Checks same credential, now the issuer is trusted and the credential is valid.

You can run the example with the following command:

```bash
cd /path/to/examples/folder/
mvn exec:java -Dexec.mainClass=net.gradbase.examples.TrustedAuthorities
```
