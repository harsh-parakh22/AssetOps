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

  theme = signal<'dark' | 'light'>('dark');
  activeDemoTab = signal<'inventory' | 'requests' | 'lifecycle'>('inventory');
  openFaqIndex = signal<number | null>(0);

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  readonly author = {
    name: 'Harsh Parakh',
    email: 'harshparakh.work@gmail.com',
    github: 'https://github.com/harsh-parakh22',
    linkedin: 'https://linkedin.com/in/harsh-parakh22',
    repo: 'https://github.com/harsh-parakh22/AssetOps'
  };

  readonly techStack: TechItem[] = [
    {
      name: 'Java 21 & Spring Boot 3.3',
      category: 'Backend Core & Concurrency',
      badge: 'Virtual Threads (Project Loom)',
      icon: '☕',
      description: 'REST API core built on Java 21 with Spring Security, Spring Data JPA, and HikariCP connection pooling.',
      whyChosen: [
        'Virtual threads provide high throughput with lightweight concurrency on top of the JVM',
        'Strong static typing and compile-time checks minimize regression risks across business workflows',
        'Spring Security method-level annotations enforce role-based access control directly on API endpoints',
        'HikariCP ensures fast, reliable database connection acquisition and pool management'
      ]
    },
    {
      name: 'PostgreSQL 16',
      category: 'Relational Database',
      badge: 'ACID Transactions & Flyway Migrations',
      icon: '🐘',
      description: 'Primary relational database maintaining asset records, user assignments, approval histories, and audit logs.',
      whyChosen: [
        'Full ACID compliance prevents state corruption during asset transfers and allocations',
        'Automated Flyway migrations ensure repeatable, version-controlled database schema changes',
        'Foreign key constraints and indexed queries guarantee relational consistency across users and assets',
        'Native UUID keys and temporal tracking maintain immutable history for every device record'
      ]
    },
    {
      name: 'Redis 7 (Upstash)',
      category: 'Distributed In-Memory Cache',
      badge: 'Low-Latency Cache Layer',
      icon: '⚡',
      description: 'In-memory caching layer storing aggregated metrics, dashboard counters, and asset statistics.',
      whyChosen: [
        'Caches compute-heavy dashboard statistics to reduce repetitive database queries',
        'Spring Cache annotations handle automatic eviction whenever assets are updated or reassigned',
        'Custom non-fatal error handler allows seamless fallback to the primary database if cache is unreachable',
        'Decreases primary database load during peak operational reporting'
      ]
    },
    {
      name: 'Angular 18',
      category: 'Frontend Single-Page Architecture',
      badge: 'Signals & Standalone Components',
      icon: '🅰️',
      description: 'Single-page web client built with Angular 18 standalone components, reactive signals, and TypeScript.',
      whyChosen: [
        'Fine-grained reactive signals provide immediate view updates without manual change-detection cycles',
        'TypeScript interfaces enforce end-to-end data contracts matching backend DTO models',
        'Lazy-loaded routing keeps initial bundle sizes compact for fast page loads',
        'Unified CSS custom properties system powers instant dark and light mode switching'
      ]
    },
    {
      name: 'WebSocket & STOMP Protocol',
      category: 'Real-Time Notification Delivery',
      badge: 'Full-Duplex Communication',
      icon: '📡',
      description: 'Bi-directional messaging channel delivering live notifications when requests are submitted or reviewed.',
      whyChosen: [
        'Eliminates repetitive HTTP polling routines from the browser client',
        'Admins receive immediate visual alerts when a team member submits a hardware request',
        'Unread notification counters update in real time without requiring a page refresh',
        'Authenticated through JWT credentials validated at WebSocket connection handshake'
      ]
    },
    {
      name: 'Docker & Hardened Nginx 1.27',
      category: 'Containerization & Edge Gateway',
      badge: 'Multi-Stage Build Architecture',
      icon: '🐳',
      description: 'Production container setup running a lightweight Nginx reverse proxy with security headers.',
      whyChosen: [
        'Multi-stage Docker builds produce lean, reproducible deployment images',
        'Nginx serves static single-page assets efficiently with asset caching and compression',
        'Security headers protect against clickjacking and MIME-type sniffing',
        'Graceful reverse-proxy error handling returns clean JSON responses during service maintenance'
      ]
    }
  ];

  readonly comparisonData: ComparisonRow[] = [
    {
      capability: 'Real-Time Alert Dispatch',
      assetops: 'Native STOMP WebSockets',
      assetopsNote: 'Instant notification delivery on request events without polling',
      servicenow: 'Complex polling / specialized modules',
      snipeit: 'Manual browser refresh required',
      excel: 'Not available'
    },
    {
      capability: 'Analytical Query Caching',
      assetops: 'Redis In-Memory Caching',
      assetopsNote: 'Pre-computed dashboard summaries with automated eviction on writes',
      servicenow: 'Enterprise database reporting',
      snipeit: 'Direct relational database queries',
      excel: 'Manual workbook recalculation'
    },
    {
      capability: 'Automated Lifecycle Tracking',
      assetops: 'Scheduled EOL Evaluation',
      assetopsNote: 'Scheduled jobs identify approaching warranty and replacement dates',
      servicenow: 'High-tier license requirement',
      snipeit: 'Static expiration fields only',
      excel: 'Manual formula upkeep'
    },
    {
      capability: 'Interface & Theming',
      assetops: 'Dark & Light Mode Included',
      assetopsNote: 'Modern responsive interface designed for fast navigation',
      servicenow: 'Complex enterprise console',
      snipeit: 'Traditional administrative dashboard',
      excel: 'Dense spreadsheet layout'
    },
    {
      capability: 'Role-Based Access Control',
      assetops: 'Method-Level API Enforcement',
      assetopsNote: 'Distinct permissions for Super Admin, IT Admin, and Employee roles',
      servicenow: 'Multi-layered permission matrices',
      snipeit: 'Standard permission groups',
      excel: 'Workbook passwords only'
    },
    {
      capability: 'Deployment & Portability',
      assetops: 'Standard Containerized Stack',
      assetopsNote: 'Runs anywhere Docker is supported with standard PostgreSQL and Redis',
      servicenow: 'Proprietary platform hosting',
      snipeit: 'Traditional server setup',
      excel: 'Local files and shared drives'
    }
  ];

  readonly faqs = [
    {
      q: 'How does AssetOps structure role-based permissions?',
      a: 'AssetOps defines three distinct roles: Super Administrator (platform configuration and user administration), IT Administrator (inventory lifecycle, equipment allocation, and request processing), and Employee (submitting hardware requests and reviewing assigned assets). Every mutation is guarded at both the routing layer and backend API methods.'
    },
    {
      q: 'Can AssetOps be deployed on standard cloud infrastructure?',
      a: 'Yes. The backend runs as a containerized Spring Boot service, the frontend runs through an Nginx container, and data persists in standard PostgreSQL and Redis instances. This architecture runs smoothly across Render, AWS, Google Cloud, Azure, or on-premises servers.'
    },
    {
      q: 'How does the lifecycle tracking workflow function?',
      a: 'AssetOps stores purchase records, warranty periods, and estimated operational lifespans for all inventory items. A scheduled background task routinely reviews these records to flag equipment approaching end-of-life, giving IT teams advance notice to plan replacements.'
    },
    {
      q: 'What occurs if the Redis cache becomes temporarily unavailable?',
      a: 'The Spring Boot caching architecture implements a non-fatal error handler. If Redis is unreachable, read requests transparently fall back to querying the PostgreSQL database directly, ensuring uninterrupted system availability.'
    },
    {
      q: 'How do real-time WebSocket notifications operate?',
      a: 'The frontend establishes a STOMP over WebSocket connection to the backend. When a hardware request is created or updated, the server publishes an event to dedicated topic queues, updating the notification badge and message history immediately.'
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

  openConsole(): void {
    if (this.isAuthenticated) {
      this.router.navigate([this.auth.isAdmin() ? '/dashboard' : '/requests']);
    } else {
      this.router.navigate(['/auth/login']);
    }
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
