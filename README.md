# nil-2fa

Derive nillion data access keys from classic web2 techniques, no wallet needed!

GOAL: At no time should a cloud provider, app administrator or developer, be able to covertly steal enough crypto seed (entropy) to make a brute force attack of secrets feasable.

> [!NOTE]  
> this is provided as alpha for testing purposes to demonstrate end to end user control of private key material

# References / Thanks:
- [ZkLogin paper](https://arxiv.org/pdf/2401.11735) - read section on `The necessity of Salt`. This was the inspiration for using deterministic signature (ed25519) of the hardware key to create "salt"
