# Sage Stage — Class Link External Relay Reference

**Status:** Architecture reference — no implementation scheduled  
**Companion document:** [Local Class Link design](collaboration-design.md)  
**Date:** 2026-07-18  
**Pricing and service limits checked:** 2026-07-18; verify again before procurement

---

## 1. Purpose

This document records how Class Link could operate through a public web link rather than
through a server running locally on the teacher's computer. It also records the available
realtime-service options and the required privacy model.

The hosted version solves the principal networking problems of the local design:

- Students and teachers make ordinary outbound HTTPS connections.
- Staff/student VLAN separation and Wi-Fi client isolation no longer block the session.
- No inbound firewall rule, LAN address, hotspot, or travel router is required.
- A universal join page and short code become possible.
- The teacher can use the browser version; the Tauri desktop application is not required.

The trade-off is that an external provider processes connection metadata. Classroom
content should therefore be end-to-end encrypted before it leaves teacher or student
devices.

## 2. Recommended direction

For initial polls, quizzes, check-ins, and moderated responses:

1. Use **Ably** as the managed realtime transport.
2. Keep the **teacher authoritative** for activities, responses, moderation, and tallies.
3. Apply **Sage Stage-controlled end-to-end encryption** to every classroom payload.
4. Give browsers short-lived, narrowly scoped relay credentials.
5. Keep session state ephemeral; save only when the teacher explicitly requests it.
6. Design the encryption envelope independently of Ably so the relay can later be replaced.

If Class Link becomes a central product capability, particularly after adding shared
documents or whiteboards, reassess a Sage Stage-owned relay built on **Cloudflare Durable
Objects**. That option offers greater protocol and lifecycle control but requires more
engineering and operational ownership.

## 3. Hosted-session architecture

```text
Teacher browser or desktop app ───────┐
                                      ├── HTTPS/WebSocket ── external relay
Student browsers ─────────────────────┘
```

The relay is a switchboard, not the classroom authority:

- It creates or identifies rooms.
- It authenticates connections using expiring permissions.
- It routes encrypted messages to the correct participants.
- It may temporarily buffer encrypted messages for reconnection.
- It never receives classroom-content encryption keys.
- It should not permanently store responses by default.

The teacher remains responsible for:

- Selecting the live activity.
- Accepting and removing participants.
- Validating responses.
- Calculating canonical tallies.
- Moderating written submissions.
- Broadcasting aggregate state.
- Deciding whether to save results.

## 4. Teacher and student experience

1. The teacher selects **Start Class Link**.
2. Sage Stage creates a temporary online room and displays a QR code, web link, and short
   code, for example `https://class.sagestage.app/join/F7K2Q`.
3. Students scan the QR code or visit the universal join page and enter `F7K2Q`.
4. Students optionally enter a first name and wait on a connected screen.
5. The teacher makes a poll, quiz, check-in, or exit ticket live.
6. The activity appears immediately on every connected student device.
7. Student responses are encrypted on their devices and relayed to the teacher.
8. The teacher decrypts and validates the responses, updates the canonical result, and
   broadcasts an encrypted aggregate state.
9. Further activities reuse the same class session; students do not reconnect each time.
10. Ending the session revokes access, destroys session keys, and expires temporary state.

Full-state resynchronisation should occur after reconnect so a device can recover without
the relay needing to understand the encrypted classroom state.

## 5. What “encrypted” must mean

There are two materially different promises:

### Transport and storage encryption

TLS protects traffic between a device and the provider. Encryption at rest protects
provider disks and backups. In both cases, the provider normally controls the keys and can
technically read the payload.

This is necessary but insufficient for Class Link's strongest privacy promise.

### End-to-end encryption

Sage Stage encrypts content before it leaves a teacher or student device. The relay receives
only ciphertext, and the decryption keys exist only on authorised classroom devices.

End-to-end encryption can protect:

- Student display names
- Activity questions and choices
- Individual votes and quiz answers
- Written responses and moderation content
- Rosters
- Tallies and saved-result snapshots in transit

The relay will still necessarily observe some metadata:

- Source IP addresses
- Random room or channel identifiers
- Connection and disconnection times
- Message sizes and frequency
- Expiring access tokens and coarse permission information

Consequently, an externally relayed Class Link must not be marketed as “no student data
leaves the classroom.” A defensible promise is that **classroom content is end-to-end
encrypted and unreadable to the relay provider**.

## 6. Key and message model

A single shared class key is not sufficient. If every student has the same key, students may
be able to read one another's raw answers or forge messages that appear to come from the
teacher.

The preferred model is:

- The teacher creates an ephemeral signing identity for the session.
- Each student establishes a separate encrypted teacher–student relationship.
- Teacher activities are broadcast-encrypted and signed by the teacher.
- Each student's response is encrypted separately for the teacher.
- Students never subscribe to a shared raw-response stream.
- The teacher broadcasts only approved content and aggregate results to the class.
- Message identifiers and sequence numbers prevent duplicate processing and replay.
- Session keys are destroyed when the teacher ends the class.

The encryption envelope should use modern authenticated encryption controlled by Sage
Stage. Keeping this layer independent of the relay prevents vendor lock-in and allows the
transport to move from Ably to Cloudflare or another provider without changing the privacy
model.

### Relay visibility boundary

| Relay can see | Relay cannot see |
|---|---|
| Random room identifier | Student names |
| IP addresses | Poll or quiz content |
| Connection times | Individual responses |
| Message sizes and frequency | Moderation text |
| Ciphertext | Canonical tallies |
| Expiring transport credentials | Session encryption keys |

## 7. Joining securely

### QR link

The QR code can include a high-entropy invitation secret in the URL fragment:

```text
https://class.sagestage.app/join/F7K2Q#key=RANDOM_SECRET
```

The fragment after `#` is not included in the HTTP request to the web server. The student
page reads it locally and uses it to authenticate or establish the encrypted session. The
relay sees the room identifier but not the fragment secret.

### Manually entered short code

A five- or six-character code cannot securely encode a full encryption key. Manual joining
therefore needs an approval and key-agreement flow:

1. The student enters the short room code.
2. The student browser creates a temporary cryptographic key pair.
3. The teacher sees and approves the pending device.
4. Teacher and student establish a private session key through the relay.
5. The relay carries the exchange but cannot derive the resulting key.

Session locking, code expiry, rate limiting, and removal controls remain necessary. A short
room code is a routing convenience, not strong authentication.

## 8. Service options

### 8.1 Ably — recommended managed transport

Ably provides browser publish/subscribe, presence, automatic reconnection, connection
recovery, channel permissions, and optional history. It distinguishes TLS from optional
message-level encryption and states that encrypted channel payloads are opaque to Ably.

Relevant characteristics:

- Direct browser publishing and subscribing
- Short-lived token authentication with channel-specific capabilities
- Presence and connection recovery
- Optional message-level symmetric encryption
- Free tier: 200 concurrent connections and 6 million messages per month
- Standard production package: $29/month plus usage
- EU-only or US-only routing: Enterprise option

Even if Ably's channel cipher is used initially, Sage Stage should own its encryption
envelope and key lifecycle. Event names, client identifiers, and other routing metadata are
not covered by Ably's payload encryption and must not contain sensitive information.

References:

- [Ably encryption](https://ably.com/docs/channels/options/encryption)
- [Ably authentication](https://ably.com/docs/auth)
- [Ably token authentication](https://ably.com/docs/auth/token)
- [Ably pricing and limits](https://ably.com/docs/platform/pricing)
- [Ably data and compliance FAQ](https://ably.com/docs/platform/pricing/faqs)

### 8.2 PubNub — strong managed alternative

PubNub provides browser publish/subscribe, presence, access control, reconnection, optional
history, and SDK-level message encryption.

Relevant characteristics:

- Direct browser publishing and subscribing
- AES-256 message encryption through its current crypto module
- Presence and optional persistence
- Free tier: 200 monthly active users or 1 million transactions
- Starter package: $98/month for 1,000 monthly active users
- GDPR and common security certifications documented by the provider

The MAU model needs careful evaluation for anonymous classroom traffic. Rotating browser
identifiers may cause students to be counted as new active users more often than expected.
Persistence should be disabled unless a product requirement explicitly needs it.

References:

- [PubNub encryption API](https://www.pubnub.com/docs/sdks/javascript/api-reference/encryption)
- [PubNub data security](https://www.pubnub.com/docs/general/setup/data-security)
- [PubNub data persistence](https://www.pubnub.com/docs/general/setup/data-persistence)
- [PubNub pricing](https://www.pubnub.com/pricing/)

### 8.3 Cloudflare Durable Objects — recommended custom-relay candidate

One Durable Object can represent one classroom room and coordinate all of its WebSockets.
The WebSocket Hibernation API allows idle classroom connections to remain connected without
keeping an object continuously active.

Relevant characteristics:

- Direct control of room lifecycle, protocol, rate limits, and reconnection state
- WebSocket coordination designed for room-like and multiplayer workloads
- Provider-managed TLS and encryption at rest
- EU, US, and FedRAMP jurisdiction constraints for Durable Objects
- Free allowance; paid Workers plan has a $5/month minimum plus usage
- Potentially inexpensive when the hibernation API is used correctly

Cloudflare's automatic encryption is not provider-blind: Cloudflare manages the keys.
Sage Stage must encrypt classroom payloads before sending them if Cloudflare must not be
able to read them. Data-location constraints also do not automatically keep all logs and
metadata in the chosen jurisdiction.

References:

- [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Durable Objects data security](https://developers.cloudflare.com/durable-objects/reference/data-security/)
- [Durable Objects data location](https://developers.cloudflare.com/durable-objects/reference/data-location/)
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

### 8.4 Pusher Channels — possible but not preferred

Pusher's private encrypted channels encrypt payload data before it reaches Pusher, so
Pusher cannot read that payload. However, its supported encrypted channels do not allow
encrypted client events to be published directly through the normal client channel API.

Student submissions would therefore need to travel through a separate Sage Stage endpoint
or a custom application-level encrypted path before being republished. This removes much
of the simplicity expected from a managed relay.

Relevant current limits and pricing:

- Free tier: 100 concurrent connections and 200,000 messages per day
- Startup package: $49/month for 500 concurrent connections
- Broadcast accounting includes both the published message and each delivered copy

References:

- [Pusher encrypted channels](https://pusher.com/docs/channels/using_channels/encrypted-channels/)
- [Pusher pricing](https://pusher.com/channels/pricing/)

### 8.5 General cloud realtime services

AWS WebSocket APIs, Azure Web PubSub, Firebase, Supabase Realtime, and similar services can
also transport Class Link messages. Their standard TLS and at-rest encryption should not be
treated as end-to-end encryption. Sage Stage would need to implement the same client-side
encryption, key agreement, ephemeral-room rules, and metadata discipline described here.

These services are worth considering when procurement, an existing cloud contract, data
residency, or integration with a broader backend matters more than a purpose-built realtime
SDK. They are not the leading choices for the first Class Link relay.

## 9. Persistence and reconnection

The default hosted session should remain ephemeral:

- The relay may hold encrypted state briefly to support reconnection.
- Long-term provider history should be disabled by default.
- The teacher remains the canonical source of live state while connected.
- A reconnecting client receives a full encrypted state snapshot.
- The session and its access tokens expire automatically.
- Ending the class invalidates joining and destroys device-held keys.
- Saving results remains an explicit teacher action.
- Saved results should go through Sage Stage's normal local-first storage unless cloud
  saving is separately enabled and explained.

If seamless teacher reconnection is required after the teacher's browser closes, the relay
may cache an encrypted session snapshot. That improves reliability but does not give the
relay the ability to read the snapshot.

## 10. Safeguarding requirements

External relay mode does not change the classroom controls required by the local design:

- Optional or anonymous student names
- Aggregate results on the projector by default
- Teacher-only queue for written responses
- Explicit approval before projecting free text
- Per-client rate limiting
- Lock new joins
- Remove participants
- Expiring room codes and credentials
- No raw individual-response stream visible to students
- Explicit save-results control

Transport authentication and content encryption solve different problems. Encryption does
not prevent an authorised student from submitting inappropriate content, flooding a room,
or sharing an invitation.

## 11. Compliance and product claims

End-to-end encryption significantly reduces the sensitivity of data exposed to the relay,
but the provider still processes IP addresses and connection metadata. Before production,
Sage Stage must establish:

- A data-processing agreement appropriate to target schools
- A current subprocessor list
- Geographic routing and storage requirements
- Log and metadata retention periods
- Incident-notification commitments
- A deletion and session-expiry policy
- Whether a school DPIA or similar assessment is required
- Accurate privacy-policy and marketing language

Appropriate product language:

> Students join through a secure web link. Classroom content is end-to-end encrypted and
> unreadable to the relay provider. Live sessions and their keys expire when the class ends
> unless the teacher explicitly saves results.

Avoid claiming that no student data leaves the classroom in external-relay mode.

## 12. Initial decision matrix

| Priority | Best fit |
|---|---|
| Fastest managed path to live polls and quizzes | Ably |
| Managed alternative with extensive presence and messaging features | PubNub |
| Maximum protocol control and likely long-term custom platform | Cloudflare Durable Objects |
| Existing application already committed to Pusher | Pusher, with the client-event limitation addressed |
| Absolute “everything stays in the classroom” promise | Local/Tauri Class Link, not an external relay |

## 13. Open questions before implementation

1. Is external relay mode the default Class Link experience or an opt-in alternative to
   local mode?
2. Is a teacher account required to create a room, or can a signed installation receive
   anonymous room-creation credentials?
3. How should manual-code joins be approved without creating excessive teacher friction?
4. What encrypted state, if any, must survive a teacher reconnect?
5. Are aggregate poll results the only saved data in the first version?
6. Is EU-only processing a launch requirement, and is Enterprise vendor pricing viable?
7. Should the first version use vendor-provided message encryption or Sage Stage's portable
   encryption envelope from day one?
8. At what scale or feature threshold should the project reassess a custom Cloudflare
   Durable Objects relay?

