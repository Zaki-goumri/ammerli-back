
```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Queue
    participant SMS_Service as smssak

    User->>+Backend: Send Phone Number
    Backend->>+Queue: Enqueue OTP Request
    Queue->>+SMS_Service: Send OTP to User
    SMS_Service-->>-User: Receive OTP
    Backend-->>-User: Respond with Temporary Token

    User->>+Backend: Send OTP and Temporary Token
    Backend->>+SMS_Service: Validate OTP
    SMS_Service-->>-Backend: OTP Validation Status

    alt OTP is Valid
        Backend-->>-User: Authenticated: User Data, Access Token, Refresh Token
    else OTP is Invalid
        Backend-->>-User: Authentication Failed
    end
```
