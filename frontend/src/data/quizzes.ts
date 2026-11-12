/**
 * Quiz data for PacketLearner Learning Center.
 * Multiple-choice questions per protocol with explanations.
 */

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'beginner' | 'intermediate'
}

export interface QuizSection {
  protocolId: string
  protocolName: string
  questions: QuizQuestion[]
}

export const QUIZ_DATA: QuizSection[] = [
  {
    protocolId: 'tcp',
    protocolName: 'TCP',
    questions: [
      {
        id: 'tcp-1',
        question: 'What is the purpose of the TCP Three-Way Handshake?',
        options: [
          'To encrypt the data before transmission',
          'To establish a reliable connection before data transfer',
          'To authenticate the user\'s identity',
          'To compress packets for faster delivery',
        ],
        correctIndex: 1,
        explanation:
          'The Three-Way Handshake (SYN → SYN-ACK → ACK) establishes a reliable, synchronized connection between two hosts before any application data flows. It negotiates sequence numbers so both sides can track data ordering.',
        difficulty: 'beginner',
      },
      {
        id: 'tcp-2',
        question: 'Which TCP flag indicates a request to close a connection?',
        options: ['SYN', 'ACK', 'RST', 'FIN'],
        correctIndex: 3,
        explanation:
          'FIN (Finish) is sent by either side to signal it has no more data to send. A graceful TCP close uses a Four-Way Handshake: FIN → ACK → FIN → ACK. RST abruptly terminates the connection without the graceful exchange.',
        difficulty: 'beginner',
      },
      {
        id: 'tcp-3',
        question: 'What does a SYN packet from an IP address to 50 different ports in 1 second most likely indicate?',
        options: [
          'Normal web browsing activity',
          'A TCP port scan or SYN flood attack',
          'A file download in progress',
          'A DNS resolution attempt',
        ],
        correctIndex: 1,
        explanation:
          'Rapid SYN packets to many sequential ports — without completing handshakes — is the textbook signature of a port scan (reconnaissance) or a SYN flood denial-of-service attack. Tools like Nmap use this exact pattern.',
        difficulty: 'intermediate',
      },
      {
        id: 'tcp-4',
        question: 'What is TCP flow control used for?',
        options: [
          'Blocking malicious traffic',
          'Preventing the sender from overwhelming the receiver\'s buffer',
          'Encrypting data in transit',
          'Authenticating packet senders',
        ],
        correctIndex: 1,
        explanation:
          'TCP\'s sliding window mechanism lets the receiver advertise how much buffer space it has. The sender respects this window size, preventing buffer overflow at the destination even when networks and processors have different speeds.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    protocolId: 'udp',
    protocolName: 'UDP',
    questions: [
      {
        id: 'udp-1',
        question: 'Which statement best describes UDP compared to TCP?',
        options: [
          'UDP is slower but more reliable',
          'UDP is faster but does not guarantee delivery',
          'UDP encrypts data while TCP does not',
          'UDP requires a handshake before sending data',
        ],
        correctIndex: 1,
        explanation:
          'UDP sends packets without establishing a connection and without acknowledgements, making it faster but unreliable. If a UDP packet is lost, the application must handle retransmission itself — or accept the data loss.',
        difficulty: 'beginner',
      },
      {
        id: 'udp-2',
        question: 'Which application typically uses UDP instead of TCP?',
        options: [
          'File download over FTP',
          'Sending email via SMTP',
          'Real-time video conferencing',
          'Secure remote access via SSH',
        ],
        correctIndex: 2,
        explanation:
          'Real-time video conferencing requires low latency over reliability — a brief dropout is acceptable, but retransmission delay would be disruptive. FTP, SMTP, and SSH all require reliability and use TCP.',
        difficulty: 'beginner',
      },
      {
        id: 'udp-3',
        question: 'How is UDP used in DNS amplification DDoS attacks?',
        options: [
          'Attackers encrypt DNS queries to avoid detection',
          'Attackers spoof victim\'s IP and send small queries that generate large DNS replies to the victim',
          'Attackers use UDP to establish persistent connections to DNS servers',
          'Attackers delete DNS cache records using UDP',
        ],
        correctIndex: 1,
        explanation:
          'Because UDP has no handshake, the source IP can be spoofed. Attackers send small DNS requests (spoofed as coming from the victim) to open resolvers. Those resolvers send large responses to the victim, amplifying the attack traffic.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    protocolId: 'dns',
    protocolName: 'DNS',
    questions: [
      {
        id: 'dns-1',
        question: 'What is the primary function of DNS?',
        options: [
          'Encrypting web traffic',
          'Routing packets between networks',
          'Translating domain names to IP addresses',
          'Authenticating user logins',
        ],
        correctIndex: 2,
        explanation:
          'DNS (Domain Name System) is the internet\'s directory service — it translates human-friendly domain names like "google.com" into the numeric IP addresses (like 142.250.80.46) that routers use to forward traffic.',
        difficulty: 'beginner',
      },
      {
        id: 'dns-2',
        question: 'Which port does DNS primarily use, and with which protocol?',
        options: ['Port 80 / TCP', 'Port 443 / TCP', 'Port 53 / UDP', 'Port 25 / TCP'],
        correctIndex: 2,
        explanation:
          'DNS uses UDP port 53 for standard queries because speed is more important than reliability for small query/response exchanges. DNS also uses TCP port 53 for zone transfers and responses larger than 512 bytes.',
        difficulty: 'beginner',
      },
      {
        id: 'dns-3',
        question: 'What is DNS cache poisoning?',
        options: [
          'Flooding a DNS server with queries to crash it',
          'Injecting false DNS records so users are redirected to attacker-controlled IPs',
          'Encrypting DNS traffic to hide it from monitoring',
          'Disabling DNS caching to slow down browsing',
        ],
        correctIndex: 1,
        explanation:
          'DNS cache poisoning inserts malicious records into a DNS resolver\'s cache, causing legitimate-looking domain queries to return attacker-controlled IP addresses. Victims are silently redirected to phishing or malware sites without noticing.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    protocolId: 'http',
    protocolName: 'HTTP',
    questions: [
      {
        id: 'http-1',
        question: 'What HTTP method is used to submit a web form?',
        options: ['GET', 'POST', 'HEAD', 'DELETE'],
        correctIndex: 1,
        explanation:
          'POST sends data in the HTTP request body, making it suitable for form submissions with usernames, passwords, or file uploads. GET sends data in the URL query string, which is visible in browser history, logs, and network captures.',
        difficulty: 'beginner',
      },
      {
        id: 'http-2',
        question: 'What does HTTP status code 404 mean?',
        options: ['Server error — try again later', 'You are not authorized', 'The resource was not found', 'The request was redirected'],
        correctIndex: 2,
        explanation:
          '404 Not Found means the server understood the request but could not find the requested resource. This usually means the URL is wrong or the page has been deleted. 401 = unauthorized, 403 = forbidden, 500 = server error.',
        difficulty: 'beginner',
      },
      {
        id: 'http-3',
        question: 'Why is HTTP considered insecure for transmitting passwords?',
        options: [
          'HTTP is too slow for password transmission',
          'HTTP sends all data in plaintext, visible to anyone intercepting the traffic',
          'HTTP does not support the POST method',
          'HTTP passwords are stored in URL parameters',
        ],
        correctIndex: 1,
        explanation:
          'HTTP does not encrypt data. Anyone on the same network — or at any network hop between client and server — can read HTTP traffic as plain text. This includes passwords, session cookies, and sensitive form data.',
        difficulty: 'beginner',
      },
    ],
  },
  {
    protocolId: 'https',
    protocolName: 'HTTPS',
    questions: [
      {
        id: 'https-1',
        question: 'What does TLS provide in HTTPS connections?',
        options: [
          'Faster page load speeds',
          'Encryption, authentication, and integrity for HTTP traffic',
          'User login and session management',
          'IP address translation',
        ],
        correctIndex: 1,
        explanation:
          'TLS (Transport Layer Security) provides: (1) Encryption — data is unreadable to eavesdroppers; (2) Authentication — the server\'s certificate proves its identity; (3) Integrity — data cannot be altered in transit without detection.',
        difficulty: 'beginner',
      },
      {
        id: 'https-2',
        question: 'What is an SSL stripping attack?',
        options: [
          'Removing the SSL certificate from a web server',
          'Downgrading an HTTPS connection to HTTP so traffic is transmitted in plaintext',
          'Flooding a TLS server with handshake requests',
          'Stealing the private key from a web server',
        ],
        correctIndex: 1,
        explanation:
          'SSL stripping intercepts the connection between the browser and server, allowing the attacker to communicate with the server over HTTPS while serving the browser over unencrypted HTTP. The user sees the page normally but traffic is exposed.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    protocolId: 'arp',
    protocolName: 'ARP',
    questions: [
      {
        id: 'arp-1',
        question: 'What problem does ARP solve?',
        options: [
          'Translating domain names to IP addresses',
          'Encrypting traffic on the local network',
          'Finding the MAC address for a known IP address on the same network',
          'Routing packets between different subnets',
        ],
        correctIndex: 2,
        explanation:
          'ARP bridges Layer 3 (IP) and Layer 2 (Ethernet). When a device knows the destination IP but needs the MAC address to form an Ethernet frame, it broadcasts an ARP Request. The owner of that IP replies with its MAC address.',
        difficulty: 'beginner',
      },
      {
        id: 'arp-2',
        question: 'What is ARP spoofing (ARP poisoning)?',
        options: [
          'Blocking ARP broadcasts on the network',
          'Sending fake ARP replies to poison ARP caches and intercept traffic (MITM attack)',
          'Flooding the network with ARP requests to find all devices',
          'Using ARP to bypass firewall rules',
        ],
        correctIndex: 1,
        explanation:
          'ARP spoofing sends forged ARP Reply packets claiming that the attacker\'s MAC address corresponds to a victim\'s IP. Other devices update their ARP cache with the false mapping, redirecting traffic through the attacker — a classic MITM position.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    protocolId: 'icmp',
    protocolName: 'ICMP',
    questions: [
      {
        id: 'icmp-1',
        question: 'What ICMP message types does the ping command use?',
        options: [
          'Type 3 (Destination Unreachable) and Type 11 (Time Exceeded)',
          'Type 8 (Echo Request) and Type 0 (Echo Reply)',
          'Type 5 (Redirect) and Type 13 (Timestamp)',
          'Type 1 (Host Redirect) and Type 4 (Source Quench)',
        ],
        correctIndex: 1,
        explanation:
          'ping sends ICMP Type 8 (Echo Request) to the target. If reachable, the target responds with ICMP Type 0 (Echo Reply). The round-trip time between request and reply is the latency ("ping time") displayed.',
        difficulty: 'beginner',
      },
      {
        id: 'icmp-2',
        question: 'How does traceroute use ICMP to map network paths?',
        options: [
          'It sends ARP requests to each router in the path',
          'It sends packets with incrementally increasing TTL values, triggering ICMP "Time Exceeded" responses from each router',
          'It queries DNS records for each intermediate router',
          'It uses TCP SYN packets to identify routers',
        ],
        correctIndex: 1,
        explanation:
          'traceroute sends packets with TTL=1 (triggers ICMP Time Exceeded from router 1), then TTL=2 (triggers from router 2), and so on. Each router that decrements TTL to 0 sends back an ICMP Time Exceeded message, revealing its IP address.',
        difficulty: 'intermediate',
      },
    ],
  },
]

export const getQuizByProtocol = (protocolId: string): QuizSection | undefined =>
  QUIZ_DATA.find((q) => q.protocolId === protocolId)
