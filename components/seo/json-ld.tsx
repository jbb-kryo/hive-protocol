interface OrganizationSchema {
  type: 'Organization'
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
  foundingDate?: string
  founders?: string[]
  email?: string
  telephone?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  contactPoint?: {
    contactType: string
    email?: string
    telephone?: string
    availableLanguage?: string[]
  }
}

interface ProductSchema {
  type: 'Product'
  name: string
  description: string
  brand: string
  category?: string
  offers?: {
    price: string
    priceCurrency: string
    availability?: string
  }
}

interface SoftwareApplicationSchema {
  type: 'SoftwareApplication'
  name: string
  description: string
  applicationCategory: string
  operatingSystem?: string
  offers?: {
    price: string
    priceCurrency: string
  }
  aggregateRating?: {
    ratingValue: number
    ratingCount: number
  }
}

interface WebPageSchema {
  type: 'WebPage'
  name: string
  description: string
  url: string
  isPartOf?: {
    name: string
    url: string
  }
}

interface FAQSchema {
  type: 'FAQPage'
  questions: Array<{
    question: string
    answer: string
  }>
}

interface BreadcrumbSchema {
  type: 'BreadcrumbList'
  items: Array<{
    name: string
    url: string
  }>
}

interface DefinedTermSchema {
  type: 'DefinedTerm'
  name: string
  description: string
  url?: string
  inDefinedTermSet?: string
}

interface WebSiteSchema {
  type: 'WebSite'
  name: string
  url: string
  description?: string
  searchAction?: {
    target: string
    queryInput: string
  }
}

interface ArticleSchema {
  type: 'Article'
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  publisher?: {
    name: string
    url: string
    logo?: string
  }
  image?: {
    url: string
    width?: number
    height?: number
  }
  articleSection?: string
  keywords?: string[]
  wordCount?: number
}

type SchemaType =
  | OrganizationSchema
  | ProductSchema
  | SoftwareApplicationSchema
  | WebPageSchema
  | FAQSchema
  | BreadcrumbSchema
  | DefinedTermSchema
  | WebSiteSchema
  | ArticleSchema

function generateOrganizationSchema(data: OrganizationSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs,
    foundingDate: data.foundingDate,
    founder: data.founders?.map((name) => ({
      '@type': 'Person',
      name,
    })),
    email: data.email,
    telephone: data.telephone,
    address: data.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: data.address.streetAddress,
          addressLocality: data.address.addressLocality,
          addressRegion: data.address.addressRegion,
          postalCode: data.address.postalCode,
          addressCountry: data.address.addressCountry,
        }
      : undefined,
    contactPoint: data.contactPoint
      ? {
          '@type': 'ContactPoint',
          contactType: data.contactPoint.contactType,
          email: data.contactPoint.email,
          telephone: data.contactPoint.telephone,
          availableLanguage: data.contactPoint.availableLanguage,
        }
      : undefined,
  }
}

function generateProductSchema(data: ProductSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    brand: {
      '@type': 'Brand',
      name: data.brand,
    },
    category: data.category,
    offers: data.offers
      ? {
          '@type': 'Offer',
          price: data.offers.price,
          priceCurrency: data.offers.priceCurrency,
          availability: data.offers.availability || 'https://schema.org/InStock',
        }
      : undefined,
  }
}

function generateSoftwareSchema(data: SoftwareApplicationSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: data.name,
    description: data.description,
    applicationCategory: data.applicationCategory,
    operatingSystem: data.operatingSystem || 'Web Browser',
    offers: data.offers
      ? {
          '@type': 'Offer',
          price: data.offers.price,
          priceCurrency: data.offers.priceCurrency,
        }
      : undefined,
    aggregateRating: data.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: data.aggregateRating.ratingValue,
          ratingCount: data.aggregateRating.ratingCount,
        }
      : undefined,
  }
}

function generateWebPageSchema(data: WebPageSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: data.name,
    description: data.description,
    url: data.url,
    isPartOf: data.isPartOf
      ? {
          '@type': 'WebSite',
          name: data.isPartOf.name,
          url: data.isPartOf.url,
        }
      : undefined,
  }
}

function generateFAQSchema(data: FAQSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }
}

function generateBreadcrumbSchema(data: BreadcrumbSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function generateDefinedTermSchema(data: DefinedTermSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: data.name,
    description: data.description,
    url: data.url,
    inDefinedTermSet: data.inDefinedTermSet || 'https://hiveprotocol.ai/glossary',
  }
}

function generateWebSiteSchema(data: WebSiteSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
    potentialAction: data.searchAction
      ? {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: data.searchAction.target,
          },
          'query-input': data.searchAction.queryInput,
        }
      : undefined,
  }
}

function generateArticleSchema(data: ArticleSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    url: data.url,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author.name,
      url: data.author.url,
    },
    publisher: data.publisher
      ? {
          '@type': 'Organization',
          name: data.publisher.name,
          url: data.publisher.url,
          logo: data.publisher.logo
            ? {
                '@type': 'ImageObject',
                url: data.publisher.logo,
              }
            : undefined,
        }
      : {
          '@type': 'Organization',
          name: 'HIVE',
          url: 'https://hive-protocol.online',
          logo: {
            '@type': 'ImageObject',
            url: 'https://hive-protocol.online/logo.png',
          },
        },
    image: data.image
      ? {
          '@type': 'ImageObject',
          url: data.image.url,
          width: data.image.width || 1200,
          height: data.image.height || 630,
        }
      : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    articleSection: data.articleSection,
    keywords: data.keywords?.join(', '),
    wordCount: data.wordCount,
  }
}

function generateSchema(data: SchemaType) {
  switch (data.type) {
    case 'Organization':
      return generateOrganizationSchema(data)
    case 'Product':
      return generateProductSchema(data)
    case 'SoftwareApplication':
      return generateSoftwareSchema(data)
    case 'WebPage':
      return generateWebPageSchema(data)
    case 'FAQPage':
      return generateFAQSchema(data)
    case 'BreadcrumbList':
      return generateBreadcrumbSchema(data)
    case 'DefinedTerm':
      return generateDefinedTermSchema(data)
    case 'WebSite':
      return generateWebSiteSchema(data)
    case 'Article':
      return generateArticleSchema(data)
    default:
      return null
  }
}

export function JsonLd({ data }: { data: SchemaType | SchemaType[] }) {
  const schemas = Array.isArray(data) ? data : [data]
  const jsonLd = schemas.map(generateSchema).filter(Boolean)

  if (jsonLd.length === 0) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd),
      }}
    />
  )
}

export type {
  OrganizationSchema,
  ProductSchema,
  SoftwareApplicationSchema,
  WebPageSchema,
  FAQSchema,
  BreadcrumbSchema,
  DefinedTermSchema,
  WebSiteSchema,
  ArticleSchema,
  SchemaType,
}
