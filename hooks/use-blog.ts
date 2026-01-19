'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_name: string
  author_slug: string | null
  category: 'blog' | 'changelog' | 'announcement' | 'tutorial'
  tags: string[]
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
  read_time: number
  version: string | null
}

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  meta_title: string | null
  meta_description: string | null
  cover_image: string | null
  display_order: number
}

export interface BlogTag {
  id: string
  slug: string
  name: string
  description: string | null
  post_count: number
}

export interface BlogAuthor {
  id: string
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
  title: string | null
  social_twitter: string | null
  social_linkedin: string | null
  social_github: string | null
}

interface UseBlogOptions {
  category?: string
  tag?: string
  authorSlug?: string
  limit?: number
  page?: number
}

interface UseBlogResult {
  posts: BlogPost[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  refetch: () => void
}

const POSTS_PER_PAGE = 9

export function useBlog(options: UseBlogOptions = {}): UseBlogResult {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const page = options.page || 1
  const limit = options.limit || POSTS_PER_PAGE

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let countQuery = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())

      if (options.category) {
        countQuery = countQuery.eq('category', options.category)
      }

      if (options.tag) {
        countQuery = countQuery.contains('tags', [options.tag])
      }

      if (options.authorSlug) {
        countQuery = countQuery.eq('author_slug', options.authorSlug)
      }

      const { count } = await countQuery

      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })

      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.tag) {
        query = query.contains('tags', [options.tag])
      }

      if (options.authorSlug) {
        query = query.eq('author_slug', options.authorSlug)
      }

      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPosts(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      setError('Failed to load posts')
      console.error('Error fetching blog posts:', err)
    } finally {
      setLoading(false)
    }
  }, [options.category, options.tag, options.authorSlug, page, limit])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const totalPages = Math.ceil(totalCount / limit)

  return {
    posts,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: page,
    refetch: fetchPosts
  }
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPost() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .maybeSingle()

        if (fetchError) throw fetchError

        setPost(data)
      } catch (err) {
        setError('Failed to load post')
        console.error('Error fetching blog post:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPost()
    }
  }, [slug])

  return { post, loading, error }
}

export function useRelatedPosts(currentSlug: string, tags: string[], category: string, limit: number = 3) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelated() {
      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .neq('slug', currentSlug)
          .or(`category.eq.${category},tags.ov.{${tags.join(',')}}`)
          .order('published_at', { ascending: false })
          .limit(limit * 2)

        if (error) throw error

        const scored = (data || []).map(post => {
          let score = 0
          if (post.category === category) score += 2
          const sharedTags = post.tags.filter((t: string) => tags.includes(t)).length
          score += sharedTags
          return { ...post, score }
        })

        scored.sort((a, b) => b.score - a.score)
        setPosts(scored.slice(0, limit))
      } catch (err) {
        console.error('Error fetching related posts:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    if (currentSlug && (tags.length > 0 || category)) {
      fetchRelated()
    }
  }, [currentSlug, tags, category, limit])

  return { posts, loading }
}

export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_categories')
          .select('*')
          .order('display_order', { ascending: true })

        if (fetchError) throw fetchError

        setCategories(data || [])
      } catch (err) {
        setError('Failed to load categories')
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

export function useBlogCategory(slug: string) {
  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('blog_categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (fetchError) throw fetchError

        setCategory(data)
      } catch (err) {
        setError('Failed to load category')
        console.error('Error fetching category:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCategory()
    }
  }, [slug])

  return { category, loading, error }
}

export function useBlogTags() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTags() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_tags')
          .select('*')
          .gt('post_count', 0)
          .order('post_count', { ascending: false })

        if (fetchError) throw fetchError

        setTags(data || [])
      } catch (err) {
        setError('Failed to load tags')
        console.error('Error fetching tags:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  return { tags, loading, error }
}

export function useBlogTag(slug: string) {
  const [tag, setTag] = useState<BlogTag | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTag() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('blog_tags')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (fetchError) throw fetchError

        setTag(data)
      } catch (err) {
        setError('Failed to load tag')
        console.error('Error fetching tag:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchTag()
    }
  }, [slug])

  return { tag, loading, error }
}

export function useBlogAuthors() {
  const [authors, setAuthors] = useState<BlogAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_authors')
          .select('*')
          .order('name', { ascending: true })

        if (fetchError) throw fetchError

        setAuthors(data || [])
      } catch (err) {
        setError('Failed to load authors')
        console.error('Error fetching authors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuthors()
  }, [])

  return { authors, loading, error }
}

export function useBlogAuthor(slug: string) {
  const [author, setAuthor] = useState<BlogAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAuthor() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('blog_authors')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (fetchError) throw fetchError

        setAuthor(data)
      } catch (err) {
        setError('Failed to load author')
        console.error('Error fetching author:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchAuthor()
    }
  }, [slug])

  return { author, loading, error }
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}
