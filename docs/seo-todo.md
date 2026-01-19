# SEO Implementation Todo

Comprehensive checklist for implementing SEO best practices to achieve top rankings across all search engines.

---

## Table of Contents

1. [Technical SEO](#1-technical-seo)
2. [On-Page SEO](#2-on-page-seo)
3. [Content SEO](#3-content-seo)
4. [Structured Data](#4-structured-data)
5. [Performance Optimization](#5-performance-optimization)
6. [Mobile SEO](#6-mobile-seo)
7. [International SEO](#7-international-seo)
8. [Local SEO](#8-local-seo)
9. [Link Building & Authority](#9-link-building--authority)
10. [Analytics & Monitoring](#10-analytics--monitoring)
11. [Social SEO](#11-social-seo)
12. [Security & Trust](#12-security--trust)

---

## 1. Technical SEO

### 1.1 XML Sitemap Generation

**Prompt:** Create a dynamic XML sitemap that automatically includes all public pages, blog posts, documentation, and changelog entries. The sitemap should update automatically when new content is added.

**Implementation Details:**
- Create `/app/sitemap.xml/route.ts` for dynamic sitemap generation
- Include all static pages with proper priority and changefreq
- Dynamically include blog posts, docs, and changelog entries from database
- Include lastmod dates based on content update timestamps
- Split into multiple sitemaps if exceeding 50,000 URLs

**Acceptance Criteria:**
- [X] Sitemap accessible at `/sitemap.xml`
- [X] All public pages included with correct URLs
- [X] Blog posts dynamically included with publish dates
- [X] Documentation pages included with section hierarchy
- [X] Changelog entries included
- [X] Priority values set appropriately (homepage: 1.0, main pages: 0.8, blog: 0.6)
- [X] Changefreq values accurate (homepage: daily, blog: weekly, docs: monthly)
- [X] Sitemap validates against XML schema
- [X] Sitemap index created if multiple sitemaps needed

---

### 1.2 Robots.txt Configuration

**Prompt:** Create a robots.txt file that properly directs search engine crawlers, allowing access to public content while blocking admin areas, API routes, and user-specific pages.

**Implementation Details:**
- Create `/public/robots.txt` or `/app/robots.txt/route.ts` for dynamic generation
- Allow all major search engine bots
- Block admin, settings, and authenticated-only routes
- Include sitemap location
- Set appropriate crawl-delay if needed

**Acceptance Criteria:**
- [X] Robots.txt accessible at `/robots.txt`
- [X] Sitemap URL included
- [X] Public pages allowed for crawling
- [X] `/admin/*` blocked
- [X] `/settings/*` blocked
- [X] `/dashboard/*` blocked (authenticated content)
- [X] `/api/*` blocked (except necessary endpoints)
- [X] `/_next/*` static assets allowed
- [X] No important pages accidentally blocked

---

### 1.3 Canonical URL Implementation

**Prompt:** Implement canonical URLs across all pages to prevent duplicate content issues. Ensure each page has a single canonical URL and handle query parameters appropriately.

**Implementation Details:**
- Add canonical meta tags to all pages via layout or page-level metadata
- Handle trailing slashes consistently
- Handle www vs non-www consistently
- Implement self-referencing canonicals on unique pages
- Point paginated content to the main page where appropriate

**Acceptance Criteria:**
- [X] Every page has a canonical URL meta tag
- [X] Canonical URLs use absolute URLs with correct domain
- [X] Consistent trailing slash handling
- [X] Query parameters excluded from canonical URLs (unless semantically meaningful)
- [X] Paginated pages have appropriate canonical strategy
- [X] No duplicate canonicals pointing to different pages

---

### 1.4 URL Structure Optimization

**Prompt:** Review and optimize URL structure across the application for SEO-friendly, human-readable URLs that include relevant keywords and follow a logical hierarchy.

**Implementation Details:**
- Audit all existing routes for SEO friendliness
- Implement URL slugs for dynamic content (blog posts, docs)
- Ensure URLs are lowercase and use hyphens
- Keep URLs concise but descriptive
- Implement proper redirects for any URL changes

**Acceptance Criteria:**
- [X] All URLs use lowercase letters
- [X] Hyphens used instead of underscores
- [X] URLs are descriptive and include target keywords
- [X] No special characters or spaces in URLs
- [X] URL depth kept to 3-4 levels maximum
- [X] Dynamic content uses semantic slugs (not IDs)
- [X] 301 redirects in place for any changed URLs

---

### 1.5 Internal Linking Structure

**Prompt:** Implement a comprehensive internal linking strategy that helps search engines understand site hierarchy and distributes page authority effectively.

**Implementation Details:**
- Create breadcrumb navigation for all pages
- Implement related content suggestions
- Add contextual links within content
- Create a logical site hierarchy
- Implement footer links to important pages

**Acceptance Criteria:**
- [X] Breadcrumb navigation on all pages (except homepage)
- [X] Breadcrumbs use structured data markup
- [X] Related posts/content shown on blog and docs
- [X] Footer contains links to all main sections
- [X] No orphan pages (pages with no internal links)
- [X] Important pages reachable within 3 clicks from homepage
- [X] Anchor text is descriptive and varied

---

### 1.6 HTTP Status Codes & Redirects

**Prompt:** Implement proper HTTP status code handling including custom 404 pages, redirect management, and error handling that maintains SEO value.

**Implementation Details:**
- Create custom 404 page with helpful navigation
- Implement 301 redirects for moved content
- Handle soft 404s appropriately
- Implement proper 410 for permanently removed content
- Set up redirect middleware for common patterns

**Acceptance Criteria:**
- [X] Custom 404 page exists with navigation options
- [X] 404 page returns proper 404 status code
- [X] Redirect map maintained for changed URLs
- [X] 301 redirects used for permanent moves
- [X] 302 redirects used only for temporary moves
- [X] No redirect chains (redirect to redirect)
- [X] No redirect loops

---

### 1.7 Crawl Budget Optimization

**Prompt:** Optimize crawl budget by ensuring search engines can efficiently crawl and index important pages while avoiding crawl traps and low-value pages.

**Implementation Details:**
- Implement pagination with rel="next/prev" or load more patterns
- Use noindex for low-value pages (search results, filters)
- Optimize site architecture for flat hierarchy
- Implement URL parameter handling in Search Console
- Remove or consolidate thin content pages

**Acceptance Criteria:**
- [X] Pagination implemented SEO-friendly way
- [X] Faceted navigation doesn't create crawl traps
- [X] Search results pages are noindexed
- [X] Filter/sort URLs handled appropriately
- [X] Session IDs not in URLs
- [X] Calendar/date archives don't create infinite URLs
- [X] Important pages crawled frequently (check logs)

---

## 2. On-Page SEO

### 2.1 Meta Title Optimization

**Prompt:** Implement unique, keyword-optimized meta titles for all pages following SEO best practices for length and format.

**Implementation Details:**
- Create metadata generation for all page types
- Include primary keyword near the beginning
- Keep titles under 60 characters
- Include brand name appropriately
- Make titles compelling for click-through

**Acceptance Criteria:**
- [X] Every page has a unique meta title
- [X] Titles are 50-60 characters maximum
- [X] Primary keyword appears in first 50% of title
- [X] Brand name included (usually at end)
- [X] No duplicate titles across site
- [X] Titles are compelling and accurate
- [X] Dynamic pages generate appropriate titles

**Page-specific titles:**
- [X] Homepage: "HIVE - AI Agent Orchestration Platform | Multi-Agent Collaboration"
- [X] Features: "Features - AI Agent Tools & Capabilities | HIVE"
- [X] Pricing: "Pricing Plans - Start Free | HIVE"
- [X] Blog: "Blog - AI Agents News & Tutorials | HIVE"
- [X] Docs: "Documentation - Getting Started Guide | HIVE"

---

### 2.2 Meta Description Optimization

**Prompt:** Create compelling, keyword-rich meta descriptions for all pages that accurately summarize content and encourage click-through from search results.

**Implementation Details:**
- Write unique descriptions for each page
- Include primary and secondary keywords naturally
- Keep between 150-160 characters
- Include call-to-action where appropriate
- Match user search intent

**Acceptance Criteria:**
- [X] Every page has a unique meta description
- [X] Descriptions are 150-160 characters
- [X] Primary keyword included naturally
- [X] Descriptions accurately summarize page content
- [X] Call-to-action included where appropriate
- [X] No duplicate descriptions
- [X] Dynamic pages generate appropriate descriptions

---

### 2.3 Heading Structure (H1-H6)

**Prompt:** Implement proper heading hierarchy across all pages with keyword-optimized H1 tags and logical subheading structure.

**Implementation Details:**
- Ensure single H1 per page
- Include primary keyword in H1
- Use H2-H6 in proper hierarchy
- Make headings descriptive and useful
- Avoid skipping heading levels

**Acceptance Criteria:**
- [X] Every page has exactly one H1 tag
- [X] H1 includes primary keyword
- [X] H1 is different from meta title (but related)
- [X] Heading hierarchy is logical (no skipping levels)
- [X] Subheadings break up content appropriately
- [X] Headings are descriptive, not generic
- [X] No headings used purely for styling

---

### 2.4 Image SEO

**Prompt:** Optimize all images for search engines including alt text, file names, compression, and modern formats.

**Implementation Details:**
- Add descriptive alt text to all images
- Use keyword-rich file names
- Implement lazy loading
- Use next/image for automatic optimization
- Provide multiple image sizes/formats
- Implement image sitemaps if needed

**Acceptance Criteria:**
- [X] All images have descriptive alt text
- [X] Alt text includes keywords where natural
- [X] Decorative images have empty alt=""
- [X] Image file names are descriptive (not IMG_001.jpg)
- [X] Images are compressed appropriately
- [X] WebP format used where supported
- [X] Lazy loading implemented for below-fold images
- [X] Image dimensions specified to prevent layout shift
- [X] Open Graph images optimized (1200x630px)

---

### 2.5 Content Optimization

**Prompt:** Ensure all page content is optimized for target keywords while maintaining natural readability and providing value to users.

**Implementation Details:**
- Conduct keyword research for each page
- Optimize keyword density (1-2%)
- Include LSI (related) keywords
- Ensure content length is appropriate
- Format content for readability

**Acceptance Criteria:**
- [X] Primary keyword in first 100 words
- [X] Keywords used naturally throughout content
- [X] Related/LSI keywords included
- [X] Content length appropriate for topic (min 300 words for landing pages)
- [X] Content formatted with paragraphs, lists, and subheadings
- [X] No keyword stuffing
- [X] Content provides genuine value

---

### 2.6 URL Keywords

**Prompt:** Ensure all URLs contain relevant keywords and accurately describe page content.

**Implementation Details:**
- Include primary keyword in URL
- Keep URLs concise
- Use hyphens between words
- Avoid stop words where possible

**Acceptance Criteria:**
- [X] Primary keyword in URL path
- [X] URLs are concise (under 75 characters)
- [X] No unnecessary words/parameters
- [X] URLs match page content accurately

---

## 3. Content SEO

### 3.1 Blog SEO Enhancement

**Prompt:** Enhance blog functionality with SEO features including categories, tags, author pages, and optimized archive pages.

**Implementation Details:**
- Implement blog categories with dedicated pages
- Add tag system with tag archive pages
- Create author pages with bio and posts
- Optimize blog archive/listing pages
- Add related posts functionality
- Implement reading time estimates

**Acceptance Criteria:**
- [X] Blog categories have dedicated, indexable pages
- [X] Category pages have unique titles and descriptions
- [X] Tags implemented with tag archive pages
- [X] Author pages exist with author bio and post list
- [X] Related posts shown on each blog post
- [X] Blog listing has pagination (not infinite scroll for SEO)
- [X] Each post has publish date and last updated date
- [X] Reading time displayed on posts
- [X] Social sharing buttons on posts

---

### 3.2 Documentation SEO

**Prompt:** Optimize documentation section for search visibility including proper hierarchy, search functionality, and version handling.

**Implementation Details:**
- Create clear documentation hierarchy
- Implement documentation search
- Add table of contents to long pages
- Handle documentation versioning SEO
- Create documentation landing page

**Acceptance Criteria:**
- [X] Documentation has clear category structure
- [X] Each doc page has unique title and description
- [X] Table of contents on long documentation pages
- [X] Documentation search doesn't create duplicate URLs
- [X] Previous/Next navigation between docs
- [X] Documentation breadcrumbs implemented
- [X] Code examples are not crawlable as links

---

### 3.3 Landing Page Optimization

**Prompt:** Create and optimize landing pages for key user journeys and search intents related to AI agents and automation.

**Implementation Details:**
- Identify high-value keywords/topics
- Create dedicated landing pages for each
- Optimize each for specific search intent
- Include clear CTAs
- A/B test page elements

**Suggested Landing Pages:**
- AI Agent Platform
- Multi-Agent Collaboration
- Workflow Automation
- AI Development Tools
- Enterprise AI Solutions

**Acceptance Criteria:**
- [X] Landing pages exist for main product categories
- [X] Each landing page targets specific keywords
- [X] Unique, valuable content on each page
- [X] Clear conversion path/CTA
- [X] Internal links to/from relevant pages
- [X] Schema markup implemented

---

### 3.4 FAQ Content

**Prompt:** Create comprehensive FAQ content that targets question-based searches and qualifies for rich snippets.

**Implementation Details:**
- Research common questions in the AI agent space
- Create FAQ section on relevant pages
- Implement FAQ schema markup
- Group FAQs by topic
- Keep answers concise but complete

**Acceptance Criteria:**
- [X] FAQ section on homepage or dedicated FAQ page
- [X] FAQs on relevant feature/product pages
- [X] FAQ schema markup implemented
- [X] Questions match real search queries
- [X] Answers are concise (40-60 words ideal for snippets)
- [X] FAQs organized by category
- [X] Internal links in FAQ answers where relevant

---

### 3.5 Glossary/Resource Pages

**Prompt:** Create glossary and educational resource pages that target informational keywords and establish topical authority.

**Implementation Details:**
- Create glossary of AI/ML terms
- Develop educational resources
- Link glossary terms throughout site
- Implement proper internal linking

**Acceptance Criteria:**
- [X] Glossary page with AI/ML terminology
- [X] Each term has dedicated page or anchor
- [X] Glossary terms linked from relevant content
- [X] Resource pages for guides and tutorials
- [X] Content establishes expertise in the field

---

## 4. Structured Data

### 4.1 Organization Schema

**Prompt:** Implement Organization schema markup to help search engines understand the business entity and display rich results.

**Implementation Details:**
- Add Organization schema to homepage
- Include logo, contact info, social profiles
- Add sameAs for social media profiles
- Include founding date and description

**Acceptance Criteria:**
- [x] Organization schema on homepage
- [x] Company name, logo, and description included
- [x] Contact information included
- [x] Social media profiles linked via sameAs
- [x] Schema validates in Google's Rich Results Test

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "HIVE",
  "url": "https://hive-protocol.online",
  "logo": "https://hive-protocol.online/logo.png",
  "description": "AI Agent Orchestration Platform",
  "sameAs": [
    "https://twitter.com/hive-protocol",
    "https://linkedin.com/company/hive-protocol",
    "https://github.com/hive-protocol"
  ]
}
```

---

### 4.2 WebSite Schema with SearchAction

**Prompt:** Implement WebSite schema with SearchAction to enable sitelinks searchbox in Google results.

**Implementation Details:**
- Add WebSite schema to homepage
- Include SearchAction for site search
- Specify search URL template

**Acceptance Criteria:**
- [X] WebSite schema on homepage
- [X] SearchAction properly configured
- [X] Search URL template correct
- [X] Schema validates

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "HIVE",
  "url": "https://hive-protocol.online",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://hive-protocol.online/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

### 4.3 Article Schema for Blog

**Prompt:** Implement Article schema markup on all blog posts to enable rich snippets in search results.

**Implementation Details:**
- Add Article schema to all blog posts
- Include author, publish date, modified date
- Add featured image
- Include publisher information

**Acceptance Criteria:**
- [X] Article schema on all blog posts
- [X] Headline matches page title
- [X] Author information included
- [X] datePublished and dateModified included
- [X] Featured image included with proper dimensions
- [X] Publisher organization included
- [X] Schema validates

---

### 4.4 BreadcrumbList Schema

**Prompt:** Implement BreadcrumbList schema to display breadcrumb navigation in search results.

**Implementation Details:**
- Add BreadcrumbList schema to all pages with breadcrumbs
- Mirror visible breadcrumb navigation
- Include position and item information

**Acceptance Criteria:**
- [X] BreadcrumbList schema matches visible breadcrumbs
- [X] Proper hierarchy maintained
- [X] Each item has name and URL
- [X] Position numbers are sequential
- [X] Schema validates

---

### 4.5 FAQ Schema

**Prompt:** Implement FAQPage schema on pages with FAQ content to enable FAQ rich snippets.

**Implementation Details:**
- Add FAQPage schema to FAQ sections
- Include all visible Q&A pairs
- Ensure schema matches visible content

**Acceptance Criteria:**
- [ ] FAQPage schema on pages with FAQ content
- [ ] All visible questions included
- [ ] Answers match visible content exactly
- [ ] No hidden FAQ content in schema
- [ ] Schema validates

---

### 4.6 SoftwareApplication Schema

**Prompt:** Implement SoftwareApplication schema to help search engines understand the product and potentially display app information.

**Implementation Details:**
- Add SoftwareApplication schema to product pages
- Include pricing information
- Add ratings if available
- Include operating system and category

**Acceptance Criteria:**
- [ ] SoftwareApplication schema on main product page
- [ ] Application category specified
- [ ] Pricing/offers included
- [ ] Operating system (Web) specified
- [ ] Schema validates

---

### 4.7 HowTo Schema for Tutorials

**Prompt:** Implement HowTo schema on tutorial and guide content to enable step-by-step rich snippets.

**Implementation Details:**
- Add HowTo schema to tutorial content
- Include all steps with descriptions
- Add images for steps where available
- Include time estimates

**Acceptance Criteria:**
- [ ] HowTo schema on tutorial/guide pages
- [ ] Steps match visible content
- [ ] Each step has name and description
- [ ] Total time included if applicable
- [ ] Images included for visual steps
- [ ] Schema validates

---

### 4.8 Review/Rating Schema

**Prompt:** Implement Review and AggregateRating schema for testimonials and product ratings.

**Implementation Details:**
- Add Review schema for individual testimonials
- Add AggregateRating for overall ratings
- Ensure compliance with Google guidelines
- Only use for genuine reviews

**Acceptance Criteria:**
- [ ] Review schema on testimonial pages
- [ ] Author and date included
- [ ] Rating values within valid range
- [ ] AggregateRating includes review count
- [ ] Reviews are genuine (Google guidelines)
- [ ] Schema validates

---

## 5. Performance Optimization

### 5.1 Core Web Vitals - LCP

**Prompt:** Optimize Largest Contentful Paint (LCP) to under 2.5 seconds for all pages.

**Implementation Details:**
- Identify LCP elements on each page type
- Optimize hero images and above-fold content
- Implement preloading for critical resources
- Optimize server response time
- Use CDN for static assets

**Acceptance Criteria:**
- [ ] LCP under 2.5s on mobile (good)
- [ ] LCP under 1.5s on desktop
- [ ] Hero images optimized and preloaded
- [ ] Critical CSS inlined
- [ ] Server response time under 200ms
- [ ] CDN configured for static assets
- [ ] Measured in PageSpeed Insights and field data

---

### 5.2 Core Web Vitals - FID/INP

**Prompt:** Optimize First Input Delay (FID) and Interaction to Next Paint (INP) to ensure responsive interactions.

**Implementation Details:**
- Minimize JavaScript execution time
- Break up long tasks
- Optimize event handlers
- Use web workers for heavy processing
- Implement code splitting

**Acceptance Criteria:**
- [ ] FID under 100ms
- [ ] INP under 200ms
- [ ] No long tasks over 50ms blocking main thread
- [ ] Event handlers optimized
- [ ] Heavy computations offloaded
- [ ] Code split by route

---

### 5.3 Core Web Vitals - CLS

**Prompt:** Optimize Cumulative Layout Shift (CLS) to under 0.1 for visual stability.

**Implementation Details:**
- Set explicit dimensions on images and videos
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS transforms for animations
- Handle font loading properly

**Acceptance Criteria:**
- [ ] CLS under 0.1
- [ ] All images have width/height attributes
- [ ] Ads/embeds have reserved space
- [ ] Fonts don't cause layout shift
- [ ] Dynamic content has reserved space
- [ ] No content inserted above viewport

---

### 5.4 Page Speed Optimization

**Prompt:** Achieve PageSpeed Insights scores of 90+ on both mobile and desktop for all critical pages.

**Implementation Details:**
- Implement image optimization
- Enable compression (gzip/brotli)
- Minimize CSS and JavaScript
- Implement caching strategies
- Optimize third-party scripts

**Acceptance Criteria:**
- [ ] Mobile PageSpeed score 90+
- [ ] Desktop PageSpeed score 95+
- [ ] All images in modern formats (WebP/AVIF)
- [ ] Brotli compression enabled
- [ ] CSS/JS minified
- [ ] Proper cache headers set
- [ ] Third-party scripts loaded efficiently

---

### 5.5 Resource Hints Implementation

**Prompt:** Implement resource hints (preconnect, prefetch, preload) to optimize resource loading.

**Implementation Details:**
- Preconnect to critical third-party origins
- Prefetch likely next pages
- Preload critical resources
- DNS-prefetch for external resources

**Acceptance Criteria:**
- [ ] Preconnect to API endpoints
- [ ] Preconnect to font providers
- [ ] Preconnect to analytics domains
- [ ] Critical fonts preloaded
- [ ] LCP image preloaded
- [ ] Prefetch implemented for likely navigations

---

## 6. Mobile SEO

### 6.1 Mobile-First Indexing Readiness

**Prompt:** Ensure the site is fully optimized for Google's mobile-first indexing with identical content and functionality on mobile.

**Implementation Details:**
- Verify mobile and desktop content parity
- Ensure all structured data present on mobile
- Check mobile meta tags
- Verify mobile internal linking
- Test mobile rendering

**Acceptance Criteria:**
- [ ] All content visible on mobile version
- [ ] Same structured data on mobile and desktop
- [ ] All internal links accessible on mobile
- [ ] Images and videos work on mobile
- [ ] No mobile-specific robots directives blocking content
- [ ] Mobile rendering matches desktop intent

---

### 6.2 Mobile Usability

**Prompt:** Ensure all pages pass Google's mobile usability requirements with no errors.

**Implementation Details:**
- Fix any mobile usability errors in Search Console
- Ensure tap targets are properly sized
- Avoid horizontal scrolling
- Use legible font sizes
- Configure viewport properly

**Acceptance Criteria:**
- [ ] No mobile usability errors in Search Console
- [ ] Tap targets at least 48x48px
- [ ] No horizontal scrolling required
- [ ] Font size at least 16px for body text
- [ ] Viewport configured correctly
- [ ] Content fits within viewport width

---

### 6.3 AMP Consideration

**Prompt:** Evaluate and potentially implement AMP (Accelerated Mobile Pages) for blog content if beneficial for the audience.

**Implementation Details:**
- Analyze if AMP would benefit the site
- If yes, implement AMP versions of blog posts
- Ensure AMP/canonical relationship correct
- Validate AMP pages

**Acceptance Criteria:**
- [ ] AMP evaluation documented
- [ ] If implemented: AMP validates
- [ ] If implemented: Canonical tags correct
- [ ] If implemented: Analytics tracking works
- [ ] If not implemented: Reasoning documented

---

## 7. International SEO

### 7.1 Hreflang Implementation

**Prompt:** If serving multiple languages/regions, implement hreflang tags correctly to target the right content to the right audience.

**Implementation Details:**
- Identify target languages/regions
- Implement hreflang tags
- Include x-default
- Ensure bidirectional hreflang
- Handle regional variations

**Acceptance Criteria:**
- [ ] Hreflang tags on all language versions
- [ ] x-default specified
- [ ] Bidirectional references (A links to B, B links to A)
- [ ] Correct language/region codes used
- [ ] Self-referencing hreflang included
- [ ] No hreflang errors in Search Console

---

### 7.2 Language/Region Targeting

**Prompt:** Configure Search Console and implement proper signals for geographic/language targeting.

**Implementation Details:**
- Set up Search Console for each target region
- Use appropriate TLD or subdirectory structure
- Implement proper HTML lang attributes
- Configure server-side location detection

**Acceptance Criteria:**
- [ ] Search Console configured for each region
- [ ] Consistent URL structure (subdirectory or subdomain)
- [ ] HTML lang attribute on all pages
- [ ] Content truly localized (not just translated)
- [ ] Local content for each target region

---

## 8. Local SEO

### 8.1 Google Business Profile

**Prompt:** Create and optimize Google Business Profile if the business has a physical presence or serves specific geographic areas.

**Implementation Details:**
- Create/claim Google Business Profile
- Complete all profile information
- Add photos and updates regularly
- Respond to reviews
- Use Google Posts

**Acceptance Criteria:**
- [ ] Google Business Profile created/claimed
- [ ] All business information complete and accurate
- [ ] Business categories selected appropriately
- [ ] Photos added (logo, cover, products)
- [ ] Business hours set
- [ ] Review response strategy in place

---

### 8.2 Local Business Schema

**Prompt:** Implement LocalBusiness schema if applicable to help search engines understand business location and details.

**Implementation Details:**
- Add LocalBusiness schema to contact/about pages
- Include address, phone, hours
- Add geo coordinates
- Include service area if applicable

**Acceptance Criteria:**
- [ ] LocalBusiness schema implemented
- [ ] NAP (Name, Address, Phone) consistent with Google Business Profile
- [ ] Opening hours included
- [ ] Geo coordinates accurate
- [ ] Schema validates

---

## 9. Link Building & Authority

### 9.1 Internal Link Audit

**Prompt:** Conduct comprehensive internal link audit to identify and fix issues with internal linking structure.

**Implementation Details:**
- Crawl site for internal link data
- Identify orphan pages
- Find broken internal links
- Analyze link distribution
- Optimize anchor text

**Acceptance Criteria:**
- [ ] No orphan pages
- [ ] No broken internal links
- [ ] Important pages have most internal links
- [ ] Anchor text is descriptive and varied
- [ ] Deep pages accessible within 3-4 clicks
- [ ] Link equity flows to priority pages

---

### 9.2 External Link Strategy

**Prompt:** Develop strategy for earning high-quality external links through content, partnerships, and PR.

**Implementation Details:**
- Create link-worthy content (research, tools, guides)
- Identify partnership opportunities
- Develop PR strategy for announcements
- Create shareable resources
- Monitor brand mentions for link opportunities

**Acceptance Criteria:**
- [ ] Link-worthy content created (original research, tools)
- [ ] Guest posting opportunities identified
- [ ] Partnership link strategy documented
- [ ] Brand mention monitoring in place
- [ ] Unlinked mentions outreach process defined
- [ ] Competitor backlink analysis completed

---

### 9.3 Toxic Link Management

**Prompt:** Monitor and manage backlink profile to identify and disavow toxic or spammy links.

**Implementation Details:**
- Set up backlink monitoring
- Regularly audit new links
- Identify toxic link patterns
- Create and maintain disavow file if needed
- Document link removal requests

**Acceptance Criteria:**
- [ ] Backlink monitoring tool configured
- [ ] Monthly backlink review process
- [ ] Toxic link identification criteria defined
- [ ] Disavow file created if needed
- [ ] Link removal request templates ready

---

## 10. Analytics & Monitoring

### 10.1 Google Search Console Setup

**Prompt:** Configure Google Search Console for comprehensive search performance monitoring and issue detection.

**Implementation Details:**
- Verify site ownership
- Submit sitemap
- Configure all relevant properties
- Set up email alerts
- Monitor Core Web Vitals

**Acceptance Criteria:**
- [ ] Site verified in Search Console
- [ ] Sitemap submitted and processing
- [ ] All URL versions verified (www, non-www, http, https)
- [ ] Email notifications enabled
- [ ] Regular review process established
- [ ] URL Inspection tool used for new content

---

### 10.2 Google Analytics 4 Configuration

**Prompt:** Configure Google Analytics 4 for comprehensive traffic and user behavior tracking.

**Implementation Details:**
- Set up GA4 property
- Configure conversion events
- Set up custom dimensions
- Implement enhanced measurement
- Connect to Search Console

**Acceptance Criteria:**
- [ ] GA4 property created
- [ ] Tracking code installed correctly
- [ ] Key conversions tracked (signups, purchases)
- [ ] Search Console linked
- [ ] Custom events for key actions
- [ ] Data retention configured appropriately

---

### 10.3 Rank Tracking Setup

**Prompt:** Implement rank tracking for priority keywords to monitor SEO performance over time.

**Implementation Details:**
- Identify priority keywords to track
- Set up rank tracking tool
- Configure competitor tracking
- Set up automated reports
- Define ranking goals

**Acceptance Criteria:**
- [ ] Priority keywords identified (50-100)
- [ ] Rank tracking tool configured
- [ ] Daily/weekly tracking enabled
- [ ] Competitor rankings tracked
- [ ] Automated weekly reports configured
- [ ] SERP feature tracking enabled

---

### 10.4 SEO Dashboard Creation

**Prompt:** Create comprehensive SEO dashboard combining data from multiple sources for easy monitoring.

**Implementation Details:**
- Combine Search Console, GA4, rank data
- Track key SEO KPIs
- Set up automated reporting
- Create executive summary view
- Configure alerts for issues

**Acceptance Criteria:**
- [ ] Dashboard includes organic traffic trends
- [ ] Search visibility/rankings tracked
- [ ] Core Web Vitals monitored
- [ ] Conversion data included
- [ ] Indexing status tracked
- [ ] Automated weekly/monthly reports
- [ ] Alert thresholds configured

---

### 10.5 Log File Analysis

**Prompt:** Implement log file analysis to understand how search engines crawl the site.

**Implementation Details:**
- Set up access log collection
- Parse logs for bot activity
- Analyze crawl patterns
- Identify crawl budget issues
- Monitor crawl errors

**Acceptance Criteria:**
- [ ] Access logs captured and stored
- [ ] Bot traffic identified and segmented
- [ ] Crawl frequency monitored
- [ ] Crawl errors identified from logs
- [ ] Response code distribution analyzed
- [ ] Crawl budget utilization understood

---

## 11. Social SEO

### 11.1 Open Graph Tags

**Prompt:** Implement Open Graph meta tags for optimal social media sharing appearance.

**Implementation Details:**
- Add OG tags to all pages
- Create page-specific OG images
- Include all required OG properties
- Test sharing on major platforms

**Acceptance Criteria:**
- [ ] og:title on all pages
- [ ] og:description on all pages
- [ ] og:image on all pages (1200x630px)
- [ ] og:url with canonical URL
- [ ] og:type appropriate for page type
- [ ] og:site_name included
- [ ] Sharing preview correct on Facebook, LinkedIn

---

### 11.2 Twitter Card Tags

**Prompt:** Implement Twitter Card meta tags for optimal appearance when shared on Twitter/X.

**Implementation Details:**
- Add Twitter card tags to all pages
- Use summary_large_image for visual content
- Include Twitter handle
- Test with Twitter Card Validator

**Acceptance Criteria:**
- [ ] twitter:card type specified
- [ ] twitter:title on all pages
- [ ] twitter:description on all pages
- [ ] twitter:image on all pages
- [ ] twitter:site with company handle
- [ ] Cards validate in Twitter Card Validator

---

### 11.3 Social Profile Integration

**Prompt:** Integrate social media profiles with the website for search engine association.

**Implementation Details:**
- Add social links to website
- Include social profiles in Organization schema
- Maintain consistent branding across profiles
- Cross-link website from all social profiles

**Acceptance Criteria:**
- [ ] Social links in website footer
- [ ] Social profiles in Organization schema sameAs
- [ ] Consistent branding on social profiles
- [ ] Website linked from all social profiles
- [ ] Social proof elements on website

---

## 12. Security & Trust

### 12.1 HTTPS Implementation

**Prompt:** Ensure complete HTTPS implementation with proper certificate and redirect configuration.

**Implementation Details:**
- Verify SSL certificate validity
- Implement HSTS
- Redirect all HTTP to HTTPS
- Update all internal references to HTTPS
- Check for mixed content

**Acceptance Criteria:**
- [ ] Valid SSL certificate installed
- [ ] Certificate covers all subdomains needed
- [ ] HTTP to HTTPS redirect (301)
- [ ] HSTS header configured
- [ ] No mixed content warnings
- [ ] All resources loaded over HTTPS

---

### 12.2 Security Headers

**Prompt:** Implement security headers to improve site security and trust signals.

**Implementation Details:**
- Add Content-Security-Policy
- Implement X-Frame-Options
- Add X-Content-Type-Options
- Configure Referrer-Policy
- Add Permissions-Policy

**Acceptance Criteria:**
- [ ] Content-Security-Policy header set
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured
- [ ] Security headers pass securityheaders.com

---

### 12.3 Trust Signals Implementation

**Prompt:** Implement trust signals throughout the site to build credibility with users and search engines.

**Implementation Details:**
- Add testimonials and reviews
- Display security badges
- Include company information
- Add team/about content
- Display certifications and partnerships

**Acceptance Criteria:**
- [ ] Customer testimonials visible
- [ ] Security/trust badges displayed
- [ ] Clear contact information
- [ ] About page with company story
- [ ] Team page with real people
- [ ] Privacy policy and terms accessible
- [ ] SSL badge/indicator visible

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. Meta titles and descriptions for all pages
2. XML sitemap generation
3. Robots.txt configuration
4. Canonical URL implementation
5. Google Search Console setup
6. Basic structured data (Organization, WebSite)

### Phase 2: Technical (Week 3-4)
1. Core Web Vitals optimization
2. Image optimization
3. Internal linking structure
4. Heading hierarchy audit
5. Mobile usability fixes
6. Security headers

### Phase 3: Content & Schema (Week 5-6)
1. Blog SEO enhancements
2. Documentation SEO
3. FAQ content and schema
4. Article schema for blog
5. BreadcrumbList schema
6. Open Graph and Twitter cards

### Phase 4: Advanced (Week 7-8)
1. Landing page optimization
2. Glossary/resource pages
3. HowTo schema for tutorials
4. Advanced structured data
5. Log file analysis
6. Link building strategy

### Phase 5: Monitoring & Iteration (Ongoing)
1. Rank tracking setup
2. SEO dashboard creation
3. Monthly audits
4. Content optimization
5. Link profile management
6. Performance monitoring

---

## Tools Recommended

- **Google Search Console** - Free, essential for monitoring
- **Google Analytics 4** - Free, traffic analysis
- **PageSpeed Insights** - Free, performance testing
- **Schema Markup Validator** - Free, structured data testing
- **Screaming Frog** - Site crawling and technical SEO
- **Ahrefs/SEMrush** - Keyword research and backlink analysis
- **GTmetrix** - Performance analysis

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Organic Traffic | Baseline | +50% | 6 months |
| Keyword Rankings (Top 10) | TBD | 50+ keywords | 6 months |
| Core Web Vitals | TBD | All "Good" | 2 months |
| PageSpeed (Mobile) | TBD | 90+ | 1 month |
| Indexed Pages | TBD | 100% intended | 1 month |
| Search Console Errors | TBD | 0 critical | 1 month |

---

## Review Schedule

- **Weekly**: Search Console errors, rankings, traffic
- **Monthly**: Full technical audit, content review, backlink audit
- **Quarterly**: Comprehensive SEO audit, strategy review
- **Annually**: Full site audit, competitive analysis, strategy overhaul
