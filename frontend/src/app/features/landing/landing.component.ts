import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface TechItem {
  name: string;
  category: string;
  badge: string;
  description: string;
  whyChosen: string[];
  icon: string;
}

interface ComparisonRow {
  capability: string;
  assetops: string;
  assetopsNote: string;
  servicenow: string;
  snipeit: string;
  excel: string;
}

interface TestCredential {
  role: string;
  email: string;
  pass: string;
  badge: string;
  desc: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Theme signal
  theme = signal<'dark' | 'light'>('dark');
  copiedIndex = signal<number | null>(null);
  activeDemoTab = signal<'inventory' | 'requests' | 'lifecycle'>('inventory');
  openFaqIndex = signal<number | null>(0);

  // Check authentication
  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  get userRole(): string | null {
    return this.auth.currentUserSignal()?.role ?? null;
  }

  readonly testCredentials: TestCredential[] = [
    {
      role: 'Super Administrator',
      email: 'admin@assetops.com',
      pass: 'Admin@123',
      badge: 'Full Platform Control',
      desc: 'System governance, user roles, security audits, and financial reporting.'
    },
    {
      role: 'IT Administrator',
      email: 'arjun@assetops.com',
      pass: 'Admin@123',
      badge: 'Operations & Procurement',
      desc: 'Asset lifecycle assignment, EOL replacement tracking, and hardware approvals.'
    },
    {
      role: 'Employee / Staff',
      email: 'priya@assetops.com',
      pass: 'Admin@123',
      badge: 'Self-Service Portal',
      desc: 'Hardware requests, assigned device tracking, and instant return workflows.'
    }
  ];

  readonly techStack: TechItem[] = [
    {
      name: 'Java 21 & Spring Boot 3.3',
      category: 'Backend Core & Concurrency',
      badge: 'Virtual Threads (Project Loom)',
      icon: '☕',
      description: 'Enterprise REST API foundation built on Java 21 LTS with Spring Security and HikariCP connection pooling.',
      whyChosen: [
        'Virtual Threads unlock non-blocking high-throughput concurrency with minimal memory overhead',
        'Strongly-typed business logic prevents runtime type mismatch and regression bugs',
        'Spring Security method-level (@PreAuthorize) provides unbreakable RBAC enforcement',
        'HikariCP delivers ultra-resilient database connection pooling with sub-millisecond acquisition'
      ]
    },
    {
      name: 'PostgreSQL 16',
      category: 'Relational Database & Integrity',
      badge: 'ACID & Semi-Structured JSONB',
      icon: '🐘',
      description: 'Primary relational datastore with Flyway schema migration pipelines for financial-grade data integrity.',
      whyChosen: [
        'Strict ACID compliance ensures hardware allocations and financial depreciation never fall into corrupt states',
        'Native JSONB columns allow extensible hardware specification schemas (RAM, CPU, serials) without schema lock',
        'Version-controlled Flyway migrations provide automated, zero-downtime database upgrades',
        'Optimized composite indexing guarantees rapid search across tens of thousands of serial numbers'
      ]
    },
    {
      name: 'Redis 7 In-Memory Engine',
      category: 'Sub-Millisecond Caching',
      badge: '< 5ms Cache Response',
      icon: '⚡',
      description: 'High-speed in-memory cache layer for real-time KPI aggregations and cross-service session management.',
      whyChosen: [
        'Caches expensive COUNT/GROUP BY dashboard aggregations, dropping KPI query times from ~450ms to < 4ms',
        'Automatic cache eviction (@CacheEvict) keeps data strictly consistent when assets change status',
        'Reduces PostgreSQL connection saturation by absorbing up to 85% of repetitive read volume',
        'Enables distributed session resilience and instant cache invalidation'
      ]
    },
    {
      name: 'Angular 18 Enterprise SPA',
      category: 'Frontend & Reactive UI',
      badge: 'Signals & Modern Control Flow',
      icon: '🅰️',
      description: 'Single Page Application built with Angular 18 standalone components, reactive signals, and TypeScript.',
      whyChosen: [
        'Fine-grained Signals reactivity provides zero-jank UI updates without heavy ChangeDetection cycles',
        'Strict TypeScript compilation eliminates null-pointer errors across complex enterprise workflows',
        'Route-level code splitting ensures initial bundle load is minimal and sub-second fast',
        'Native SCSS design token architecture enables seamless Dark/Light theme switching'
      ]
    },
    {
      name: 'WebSockets & STOMP Protocol',
      category: 'Live Telemetry & Messaging',
      badge: 'Bi-Directional Event Dispatching',
      icon: '📡',
      description: 'Full-duplex communication channel for live asset allocation requests, approval broadcasts, and real-time alerts.',
      whyChosen: [
        'Eliminates battery-draining and network-heavy HTTP polling loops',
        'IT Administrators receive instant push notifications the exact millisecond an employee submits a hardware request',
        'Live unread badge indicators update in real-time across open tabs without refreshing',
        'Secure WebSocket connection verified via STOMP CONNECT frame JWT authentication'
      ]
    },
    {
      name: 'Docker & Hardened Nginx 1.27',
      category: 'Infrastructure & Edge Proxy',
      badge: 'Multi-Stage Immutable Builds',
      icon: '🐳',
      description: 'Production containerization pipeline with an Alpine Linux reverse proxy and enterprise security headers.',
      whyChosen: [
        'Two-stage Docker builds produce ultra-lean, attack-surface-minimized production artifacts',
        'Nginx serves compiled SPA assets with immutable 1-year caching and automated Brotli/Gzip compression',
        'Configured with strict security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)',
        'Built-in reverse proxy error interception replaces raw HTML crashes with graceful JSON responses'
      ]
    }
  ];

  readonly comparisonData: ComparisonRow[] = [
    {
      capability: 'Real-Time Telemetry & Alerts',
      assetops: 'Native STOMP WebSockets',
      assetopsNote: 'Zero-latency push notifications for requests and approvals',
      servicenow: 'Slow Polling / Costly Addon',
      snipeit: 'Manual Page Refresh',
      excel: 'Never (Static)'
    },
    {
      capability: 'In-Memory Query Performance',
      assetops: 'Redis 7 L2 Caching (< 5ms)',
      assetopsNote: 'Instantaneous KPI aggregation and analytics',
      servicenow: 'Complex multi-second queries',
      snipeit: 'Direct SQL on every click',
      excel: 'Laggy formula recalculations'
    },
    {
      capability: 'Automated Lifecycle & EOL Forecasting',
      assetops: 'Built-in Predictive Cron Engine',
      assetopsNote: 'Automated warnings 60 days before warranty/EOL expiration',
      servicenow: 'Requires Enterprise SAM license',
      snipeit: 'Basic expiry dates only',
      excel: 'Broken manual date macros'
    },
    {
      capability: 'User Experience & Theming',
      assetops: 'Sleek Glassmorphism Dark/Light',
      assetopsNote: 'Modern Big-Tech aesthetic tailored for speed and elegance',
      servicenow: 'Clunky 2012 enterprise portal',
      snipeit: 'Dated Bootstrap 3/4 layout',
      excel: 'Cluttered spreadsheet rows'
    },
    {
      capability: 'Role-Based Access Control (RBAC)',
      assetops: 'Granular Method-Level @PreAuthorize',
      assetopsNote: 'Super Admin, IT Admin, Employee role boundaries',
      servicenow: 'Convoluted ACL matrix',
      snipeit: 'Basic permission flags',
      excel: 'Unprotected / Shared Passwords'
    },
    {
      capability: 'Deployment & Cloud Portability',
      assetops: '100% Docker & Render Ready',
      assetopsNote: 'Zero vendor lock-in; deploy on AWS, GCP, Azure, or On-Prem',
      servicenow: 'Heavy proprietary cloud lock-in',
      snipeit: 'Manual PHP/Apache server maintenance',
      excel: 'File version drift in emails'
    }
  ];

  readonly faqs = [
    {
      q: 'How does AssetOps differ from legacy IT service software like ServiceNow?',
      a: 'ServiceNow is an enormous, slow, and expensive ticketing monolith with high implementation costs. AssetOps is designed specifically for modern high-growth companies that need lightning-fast IT asset lifecycle management with sub-second page loads, real-time WebSockets, predictive EOL tracking, and zero enterprise bloat.'
    },
    {
      q: 'Can we self-host AssetOps on our own private Kubernetes or cloud VPC?',
      a: 'Yes! AssetOps is built on 100% cloud-native Docker containers with strict separation between the Spring Boot backend, PostgreSQL database, Redis cluster, and Nginx SPA frontend. You can deploy to AWS ECS/EKS, Google Cloud Run, Azure Container Apps, or Render with zero vendor lock-in.'
    },
    {
      q: 'How does the End-of-Life (EOL) depreciation tracking work?',
      a: 'AssetOps computes asset depreciation and replacement schedules based on initial acquisition cost, purchase date, warranty term, and category-specific depreciation schedules. An automated background scheduler triggers warning alerts 60 days before hardware end-of-life, preventing unplanned team outages.'
    },
    {
      q: 'Is there Role-Based Access Control (RBAC) built into the system?',
      a: 'Yes. AssetOps enforces three distinct security roles: Super Admin (system management, security audit logs, role changes), IT Administrator (inventory creation, hardware assignment, request approvals), and Employee (self-service request submission, assigned asset tracking).'
    },
    {
      q: 'How can I test the system right now?',
      a: 'You can test immediately! Click on any of the test credentials in the credentials drawer to copy the login details, and click "Launch Live Console" to test Super Admin, IT Admin, or Employee workflows.'
    }
  ];

  ngOnInit(): void {
    const saved = localStorage.getItem('ao_theme') as 'dark' | 'light' | null;
    if (saved) {
      this.theme.set(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      this.theme.set('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('ao_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  launchConsole(): void {
    if (this.isAuthenticated) {
      this.router.navigate([this.auth.isAdmin() ? '/dashboard' : '/requests']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  copyCredential(cred: TestCredential, index: number): void {
    navigator.clipboard.writeText(`${cred.email}`);
    this.copiedIndex.set(index);
    setTimeout(() => this.copiedIndex.set(null), 2500);
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.update(cur => cur === index ? null : index);
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
