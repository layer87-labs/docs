import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

interface Project {
  name: string;
  description: string;
  href: string;
  badge: string;
}

const PROJECTS: Project[] = [
  {
    name: 'relctl',
    description:
      'Release automation CLI for GitHub. Derives SemVer bumps from branch names, creates release drafts, uploads assets, and publishes — all from a single binary.',
    href: '/docs/relctl/intro',
    badge: 'Go · stable',
  },
];

function GlowOrb({className}: {className: string}) {
  return <div className={`${styles.orb} ${className}`} aria-hidden />;
}

function Hero() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <section className={styles.hero}>
      <GlowOrb className={styles.orbTopLeft} />
      <GlowOrb className={styles.orbBottomRight} />

      <div className={styles.heroInner}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Open source by Layer87
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.gradientText}>{siteConfig.title}</span>
        </h1>

        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>

        <div className={styles.heroCtas}>
          <Link className={styles.btnPrimary} to="/docs">
            Browse Docs
          </Link>
          <Link
            className={styles.btnSecondary}
            href="https://github.com/layer87-labs"
            target="_blank"
            rel="noopener noreferrer">
            GitHub ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProjectCard({project}: {project: Project}) {
  return (
    <Link to={project.href} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardName}>{project.name}</span>
        <span className={styles.cardBadge}>{project.badge}</span>
      </div>
      <p className={styles.cardDesc}>{project.description}</p>
      <span className={styles.cardArrow}>View docs →</span>
    </Link>
  );
}

function Projects() {
  return (
    <section className={styles.projects}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <div className={styles.grid}>
          {PROJECTS.map((p) => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout title="layer87-labs" description="Open source tools by Layer87">
      <Hero />
      <Projects />
    </Layout>
  );
}
