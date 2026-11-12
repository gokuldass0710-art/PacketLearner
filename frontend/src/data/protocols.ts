/**
 * Protocol educational data for the PacketLearner Learning Center.
 * All content is statically defined — no network calls required.
 */

export interface ProtocolExample {
  scenario: string
  description: string
}

export interface ProtocolData {
  id: string
  name: string
  fullName: string
  layer: string
  layerNumber: number
  color: string    // tailwind text color class
  bgColor: string  // tailwind bg color class
  borderColor: string
  ports?: string
  headerIcon: string
  tagline: string
  definition: string
  howItWorks: string[]
  realWorldExamples: ProtocolExample[]
  securityRelevance: string
  commonAttacks: string[]
  beginnerTip: string
  keyFact: string
}

export const PROTOCOL_DATA: ProtocolData[] = [
  {
    id: 'tcp',
    name: 'TCP',
    fullName: 'Transmission Control Protocol',
    layer: 'Transport',
    layerNumber: 4,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    ports: 'Various (defined by application)',
    headerIcon: '🔗',
    tagline: 'Reliable, ordered, connection-based data delivery',
    definition:
      'TCP is the backbone of the internet. It guarantees that data sent from one computer arrives at another computer completely, in the correct order, and without corruption. If packets are lost, TCP automatically requests retransmission.',
    howItWorks: [
      'Connection Setup: Before sending data, TCP performs a Three-Way Handshake (SYN → SYN-ACK → ACK) to establish a reliable session.',
      'Sequencing: Every byte of data is numbered so the receiver can reassemble packets in the correct order even if they arrive out of sequence.',
      'Acknowledgements: The receiver sends ACK (acknowledgement) packets back to confirm receipt. Missing ACKs trigger retransmission.',
      'Flow Control: TCP adjusts how fast data is sent based on the receiver\'s capacity using a sliding window mechanism.',
      'Connection Teardown: After data transfer, a Four-Way Handshake (FIN → ACK → FIN → ACK) cleanly closes the connection.',
    ],
    realWorldExamples: [
      { scenario: 'Web Browsing', description: 'Every HTTP/HTTPS request uses TCP to ensure web page content arrives intact.' },
      { scenario: 'Email', description: 'SMTP, IMAP, and POP3 all rely on TCP to deliver email messages reliably.' },
      { scenario: 'File Transfer', description: 'FTP and SFTP use TCP to ensure files arrive without corruption.' },
      { scenario: 'SSH Remote Access', description: 'SSH sessions use TCP port 22 to maintain stable, ordered command channels.' },
    ],
    securityRelevance:
      'Attackers exploit TCP in many ways — SYN flood attacks overwhelm servers by sending many SYN packets without completing the handshake. RST attacks can forcibly terminate connections. Port scanning tools like Nmap use TCP to discover open services.',
    commonAttacks: ['SYN Flood (DoS)', 'TCP RST Injection', 'Session Hijacking', 'Port Scanning', 'Man-in-the-Middle'],
    beginnerTip:
      'Think of TCP like certified mail — the sender gets a receipt, and the post office will redeliver if a package is lost. It\'s slower than regular mail but far more reliable.',
    keyFact: 'TCP flags (SYN, ACK, FIN, RST, PSH, URG) are single bits in the packet header — just 1 or 0. Learning to read them is like learning Morse code for network traffic.',
  },
  {
    id: 'udp',
    name: 'UDP',
    fullName: 'User Datagram Protocol',
    layer: 'Transport',
    layerNumber: 4,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    ports: 'Various (DNS:53, DHCP:67/68, NTP:123)',
    headerIcon: '⚡',
    tagline: 'Fast, lightweight, fire-and-forget delivery',
    definition:
      'UDP sends data packets (called datagrams) without establishing a connection first and without guaranteeing delivery. This makes it much faster than TCP at the cost of reliability. Missing packets are simply lost — no retransmission happens.',
    howItWorks: [
      'No handshake: UDP sends data immediately without a setup phase.',
      'No ordering: Packets may arrive out of order and UDP does not reorder them.',
      'No acknowledgement: The sender never knows if the receiver got the data.',
      'Minimal header: UDP has only an 8-byte header vs TCP\'s 20+ bytes, reducing overhead.',
      'Application responsibility: If reliability is needed, the application layer must handle it (e.g., QUIC protocol).',
    ],
    realWorldExamples: [
      { scenario: 'Video Streaming', description: 'Dropped frames in video are acceptable — retransmitting old frames would cause worse lag.' },
      { scenario: 'Online Gaming', description: 'Real-time game state updates favour speed over perfect delivery.' },
      { scenario: 'DNS Queries', description: 'Short DNS lookups use UDP because a quick retry is faster than TCP setup.' },
      { scenario: 'VoIP Calls', description: 'Voice calls prefer UDP — a re-played word a second late is more disruptive than a brief dropout.' },
    ],
    securityRelevance:
      'UDP is a favourite for DDoS amplification attacks. Because UDP has no handshake, attackers spoof the victim\'s IP as the source and send small requests to servers that reply with large responses, flooding the victim.',
    commonAttacks: ['UDP Flood (DoS)', 'DNS Amplification Attack', 'NTP Amplification Attack', 'IP Spoofing'],
    beginnerTip:
      'Think of UDP like a flyer dropped from a plane — fast and cheap, but no guarantee it reaches anyone or lands in order. Perfect when speed matters more than perfection.',
    keyFact: 'A UDP packet lost mid-game might make your character teleport briefly. A TCP retransmission in a game would cause a painful, noticeable lag spike.',
  },
  {
    id: 'dns',
    name: 'DNS',
    fullName: 'Domain Name System',
    layer: 'Application',
    layerNumber: 7,
    color: 'text-lime-400',
    bgColor: 'bg-lime-400/10',
    borderColor: 'border-lime-400/40',
    ports: 'UDP/TCP port 53',
    headerIcon: '📖',
    tagline: 'The internet\'s phone book — translates names to IP addresses',
    definition:
      'DNS converts human-readable domain names (like google.com) into numeric IP addresses (like 142.250.80.46) that computers use to route traffic. Without DNS, you would need to memorize the IP address of every website.',
    howItWorks: [
      'Your browser requests google.com → Your OS checks its local DNS cache first.',
      'Cache miss → Query sent to your Recursive Resolver (usually your ISP or 8.8.8.8).',
      'Resolver asks Root Name Servers → pointed to .com TLD servers.',
      'TLD servers direct to Google\'s Authoritative Name Servers.',
      'Authoritative server returns the IP address → cached at every step for future speed.',
    ],
    realWorldExamples: [
      { scenario: 'Website Access', description: 'Every URL you type triggers at least one DNS query before the page loads.' },
      { scenario: 'Email Routing', description: 'MX records in DNS tell mail servers where to deliver email for a domain.' },
      { scenario: 'Anti-Spam', description: 'SPF and DKIM records in DNS help verify email sender legitimacy.' },
      { scenario: 'Load Balancing', description: 'Large sites return multiple IPs via DNS to distribute traffic across servers.' },
    ],
    securityRelevance:
      'DNS was designed without security in mind and is widely exploited. DNS cache poisoning can redirect users to malicious sites. DNS tunneling hides data exfiltration inside DNS queries. Many malware families use DNS for Command & Control.',
    commonAttacks: ['DNS Cache Poisoning', 'DNS Tunneling (data exfil)', 'DGA (Domain Generation Algorithms)', 'DNS Hijacking', 'DNS Amplification DDoS'],
    beginnerTip:
      'Look for unusually long DNS query names, high query frequency from one host, or queries for newly-registered domains — these are classic malware indicators.',
    keyFact: 'A single web page load can trigger 20–50 DNS queries — for the main domain, CDN assets, analytics trackers, and third-party scripts.',
  },
  {
    id: 'http',
    name: 'HTTP',
    fullName: 'HyperText Transfer Protocol',
    layer: 'Application',
    layerNumber: 7,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    ports: 'TCP port 80',
    headerIcon: '🌐',
    tagline: 'The language browsers and web servers speak to each other',
    definition:
      'HTTP is a request-response protocol that defines how web browsers ask for pages and how servers respond. Every time you open a website, your browser sends HTTP requests and receives HTTP responses containing HTML, images, and other resources.',
    howItWorks: [
      'Client Request: Browser sends GET /index.html HTTP/1.1 with headers (Host, User-Agent, Cookies).',
      'Server Response: Server replies with status code (200 OK, 404 Not Found, 302 Redirect) + content.',
      'Stateless: Each HTTP request is independent — servers don\'t remember previous requests (solved by cookies/sessions).',
      'Methods: GET (fetch), POST (submit data), PUT (update), DELETE (remove), HEAD (headers only).',
      'Status Codes: 1xx (info), 2xx (success), 3xx (redirect), 4xx (client error), 5xx (server error).',
    ],
    realWorldExamples: [
      { scenario: 'API Calls', description: 'REST APIs use HTTP methods and JSON payloads to exchange data between services.' },
      { scenario: 'Form Submission', description: 'Login forms POST credentials to the server over HTTP (or ideally HTTPS).' },
      { scenario: 'Web Scraping', description: 'Automated tools use HTTP GET requests to download web content programmatically.' },
      { scenario: 'Webhooks', description: 'Services send real-time event notifications via HTTP POST to registered endpoints.' },
    ],
    securityRelevance:
      'HTTP sends all data in plaintext — usernames, passwords, cookies, and content are visible to anyone on the network who can intercept the traffic. Never send sensitive data over HTTP without TLS encryption (HTTPS).',
    commonAttacks: ['Credential Sniffing (plaintext)', 'Session Hijacking (cookie theft)', 'SQL Injection via HTTP Parameters', 'XSS via HTTP Response', 'HTTP Response Splitting'],
    beginnerTip:
      'In a packet capture, HTTP traffic is completely readable. Search for "Authorization:", "Cookie:", or "password=" strings in packet contents — they\'ll be in plain text.',
    keyFact: 'HTTP status code 418 "I\'m a teapot" is a real, official RFC. It was created as an April Fools\' joke in 1998 but was never removed from the standard.',
  },
  {
    id: 'https',
    name: 'HTTPS',
    fullName: 'HTTP Secure (HTTP over TLS)',
    layer: 'Application',
    layerNumber: 7,
    color: 'text-teal-300',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/40',
    ports: 'TCP port 443',
    headerIcon: '🔒',
    tagline: 'HTTP with an encrypted, authenticated tunnel',
    definition:
      'HTTPS is HTTP wrapped inside a TLS (Transport Layer Security) encrypted tunnel. The browser verifies the server\'s identity using a digital certificate, then encrypts all communication so eavesdroppers see only scrambled data.',
    howItWorks: [
      'TCP connection established on port 443.',
      'TLS Handshake: Client and server negotiate cipher suites and authenticate the server\'s certificate.',
      'Key Exchange: Both sides derive symmetric encryption keys using asymmetric cryptography (RSA or ECDH).',
      'Encrypted Channel: All subsequent HTTP messages are encrypted with the agreed symmetric key.',
      'Certificate Validation: Browser checks the certificate against a trusted Certificate Authority (CA) chain.',
    ],
    realWorldExamples: [
      { scenario: 'Online Banking', description: 'All banking sites require HTTPS to protect financial transactions from interception.' },
      { scenario: 'E-Commerce', description: 'Payment card data is transmitted only over HTTPS to comply with PCI DSS standards.' },
      { scenario: 'Social Media', description: 'Login credentials and private messages traverse HTTPS encrypted connections.' },
      { scenario: 'API Authentication', description: 'Bearer tokens and API keys are sent in HTTPS headers, invisible to network observers.' },
    ],
    securityRelevance:
      'HTTPS protects confidentiality and authenticity but not everything. Attackers use SSL stripping attacks to downgrade HTTPS to HTTP. Malware can use HTTPS for C2 communication, hiding inside legitimate-looking TLS traffic.',
    commonAttacks: ['SSL Stripping', 'Certificate Forgery', 'Weak Cipher Exploitation', 'BEAST/POODLE Attacks', 'Malware C2 over HTTPS'],
    beginnerTip:
      'In packet captures, HTTPS traffic appears as opaque "Application Data" TLS records — you cannot read the HTTP payload without the decryption key. This is by design!',
    keyFact: 'As of 2024, over 95% of all internet traffic uses HTTPS. Chrome marks all HTTP pages with a "Not Secure" warning.',
  },
  {
    id: 'arp',
    name: 'ARP',
    fullName: 'Address Resolution Protocol',
    layer: 'Network / Data Link',
    layerNumber: 2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    ports: 'No port — operates below IP',
    headerIcon: '📡',
    tagline: 'Translates IP addresses into physical MAC addresses on a local network',
    definition:
      'ARP bridges Layer 3 (IP) and Layer 2 (Ethernet) by answering the question: "I know the IP address — what is the MAC address of that device on this local network?" Without ARP, Ethernet frames cannot be properly addressed to reach local devices.',
    howItWorks: [
      'Your computer wants to send data to 192.168.1.5 on the local network.',
      'ARP broadcasts: "Who has 192.168.1.5? Tell 192.168.1.1" — every device on the LAN receives this.',
      '192.168.1.5 responds: "I am 192.168.1.5 — my MAC is AA:BB:CC:DD:EE:FF".',
      'The MAC address is cached in the ARP table (arp -a) for future use.',
      'The original data packet is then sent directly to that MAC address.',
    ],
    realWorldExamples: [
      { scenario: 'Home Router', description: 'Your PC ARPs for the router\'s MAC address every time you open a new website.' },
      { scenario: 'Printer Discovery', description: 'Network printers are found via ARP broadcasts on the local subnet.' },
      { scenario: 'Gratuitous ARP', description: 'Devices announce their own IP/MAC pairing at startup to update others\' ARP caches.' },
      { scenario: 'VRRP/HSRP', description: 'Redundancy protocols use ARP to announce failover to a new gateway MAC address.' },
    ],
    securityRelevance:
      'ARP has no authentication — any device can claim to own any IP address. ARP spoofing (ARP poisoning) lets an attacker intercept traffic between two hosts by poisoning their ARP caches, creating a Man-in-the-Middle position.',
    commonAttacks: ['ARP Spoofing / Poisoning', 'ARP Cache Poisoning (MITM)', 'Denial of Service via fake ARP', 'MAC Flooding'],
    beginnerTip:
      'Look for multiple ARP replies for the same IP from different MAC addresses — this is a classic indicator of ARP spoofing (MITM attack) in progress.',
    keyFact: 'ARP was designed in 1982 (RFC 826) with zero security. There is still no universally-deployed secure replacement — networks rely on Dynamic ARP Inspection (DAI) on managed switches.',
  },
  {
    id: 'icmp',
    name: 'ICMP',
    fullName: 'Internet Control Message Protocol',
    layer: 'Network',
    layerNumber: 3,
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/40',
    ports: 'No port — operates at IP layer',
    headerIcon: '📶',
    tagline: 'The internet\'s diagnostic and error reporting protocol',
    definition:
      'ICMP is used by network devices to send error messages and operational information — not for user data. The well-known ping command uses ICMP Echo Request/Reply to test connectivity and measure round-trip time.',
    howItWorks: [
      'ICMP Type 8 (Echo Request): ping sends this to test if a host is reachable.',
      'ICMP Type 0 (Echo Reply): The target host responds if it\'s up and reachable.',
      'ICMP Type 3 (Destination Unreachable): Router tells sender the destination can\'t be reached.',
      'ICMP Type 11 (Time Exceeded): TTL expired — used by traceroute to map network paths.',
      'ICMP Type 5 (Redirect): Router tells host to use a better gateway path.',
    ],
    realWorldExamples: [
      { scenario: 'ping command', description: '"ping 8.8.8.8" sends ICMP Echo Requests to Google\'s DNS server and reports latency.' },
      { scenario: 'traceroute / tracert', description: 'Uses ICMP TTL Exceeded messages to map every router hop along a network path.' },
      { scenario: 'Network Monitoring', description: 'Network management systems ping devices regularly to detect outages.' },
      { scenario: 'MTU Discovery', description: 'ICMP "Fragmentation Needed" messages help determine the Maximum Transmission Unit of a path.' },
    ],
    securityRelevance:
      'ICMP is frequently abused — ping floods can overwhelm targets, ICMP tunneling hides data exfiltration inside ping packets, and ICMP Redirect messages can reroute traffic through an attacker\'s machine.',
    commonAttacks: ['Ping Flood (ICMP DoS)', 'Smurf Attack (ICMP amplification)', 'ICMP Tunneling (data exfil)', 'Ping of Death', 'ICMP Redirect Attack'],
    beginnerTip:
      'Many firewalls block ICMP. If ping fails, it doesn\'t always mean the host is down — it may simply be filtering ICMP. Use TCP-based tools like nc or curl to verify.',
    keyFact: '"Ping of Death" was a 1990s exploit sending oversized ICMP packets (> 65,535 bytes) to crash operating systems. Modern OS versions are immune.',
  },
]

export const getProtocolById = (id: string): ProtocolData | undefined =>
  PROTOCOL_DATA.find((p) => p.id === id)
