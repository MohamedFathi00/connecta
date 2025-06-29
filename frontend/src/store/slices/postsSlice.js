import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import postsAPI from '../../services/postsAPI'

// إجراءات غير متزامنة
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, limit = 10, type = 'following' }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getPosts({ page, limit, type })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب المنشورات')
    }
  }
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await postsAPI.createPost(postData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إنشاء المنشور')
    }
  }
)

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postsAPI.likePost(postId)
      return { postId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في الإعجاب')
    }
  }
)

export const sharePost = createAsyncThunk(
  'posts/sharePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postsAPI.sharePost(postId)
      return { postId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في المشاركة')
    }
  }
)

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await postsAPI.deletePost(postId)
      return postId
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في حذف المنشور')
    }
  }
)

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.addComment(postId, content)
      return { postId, comment: response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إضافة التعليق')
    }
  }
)

export const reportPost = createAsyncThunk(
  'posts/reportPost',
  async ({ postId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.reportPost(postId, { reason, description })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إرسال البلاغ')
    }
  }
)

const initialState = {
  posts: [],
  currentPost: null,
  loading: false,
  creating: false,
  error: null,
  hasMore: true,
  page: 1,
  totalPosts: 0,
  feedType: 'following', // following, explore, trending
  filters: {
    type: 'all', // all, text, image, video, audio
    timeRange: 'all', // all, today, week, month
    sortBy: 'recent' // recent, popular, trending
  },
  searchQuery: '',
  searchResults: [],
  searchLoading: false
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFeedType: (state, action) => {
      state.feedType = action.payload
      state.posts = []
      state.page = 1
      state.hasMore = true
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.posts = []
      state.page = 1
      state.hasMore = true
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    clearSearchResults: (state) => {
      state.searchResults = []
      state.searchQuery = ''
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id)
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload }
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload)
    },
    addPostToBeginning: (state, action) => {
      state.posts.unshift(action.payload)
      state.totalPosts += 1
    },
    resetPosts: (state) => {
      state.posts = []
      state.page = 1
      state.hasMore = true
      state.totalPosts = 0
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload
    }
  },
  extraReducers: (builder) => {
    // جلب المنشورات
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        const { posts, totalPosts, hasMore, page } = action.payload
        
        if (page === 1) {
          state.posts = posts
        } else {
          state.posts = [...state.posts, ...posts]
        }
        
        state.totalPosts = totalPosts
        state.hasMore = hasMore
        state.page = page
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // إنشاء منشور
    builder
      .addCase(createPost.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.creating = false
        state.posts.unshift(action.payload.post)
        state.totalPosts += 1
      })
      .addCase(createPost.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload
      })

    // الإعجاب بمنشور
    builder
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, isLiked, likesCount } = action.payload
        const post = state.posts.find(p => p.id === postId)
        if (post) {
          post.isLiked = isLiked
          post.likesCount = likesCount
        }
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.isLiked = isLiked
          state.currentPost.likesCount = likesCount
        }
      })

    // مشاركة منشور
    builder
      .addCase(sharePost.fulfilled, (state, action) => {
        const { postId, sharesCount } = action.payload
        const post = state.posts.find(p => p.id === postId)
        if (post) {
          post.sharesCount = sharesCount
        }
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.sharesCount = sharesCount
        }
      })

    // حذف منشور
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(post => post.id !== action.payload)
        state.totalPosts -= 1
        if (state.currentPost && state.currentPost.id === action.payload) {
          state.currentPost = null
        }
      })

    // إضافة تعليق
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload
        const post = state.posts.find(p => p.id === postId)
        if (post) {
          post.commentsCount += 1
          if (post.comments) {
            post.comments.unshift(comment)
          }
        }
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.commentsCount += 1
          if (state.currentPost.comments) {
            state.currentPost.comments.unshift(comment)
          }
        }
      })
  },
})

export const {
  clearError,
  setFeedType,
  setFilters,
  setSearchQuery,
  clearSearchResults,
  updatePostInList,
  removePostFromList,
  addPostToBeginning,
  resetPosts,
  setCurrentPost
} = postsSlice.actions

export default postsSlice.reducer

// Selectors
export const selectPosts = (state) => state.posts.posts
export const selectCurrentPost = (state) => state.posts.currentPost
export const selectPostsLoading = (state) => state.posts.loading
export const selectPostsError = (state) => state.posts.error
export const selectHasMorePosts = (state) => state.posts.hasMore
export const selectPostsPage = (state) => state.posts.page
export const selectFeedType = (state) => state.posts.feedType
export const selectPostsFilters = (state) => state.posts.filters
export const selectSearchQuery = (state) => state.posts.searchQuery
export const selectSearchResults = (state) => state.posts.searchResults