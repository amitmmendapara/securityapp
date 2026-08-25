// ─────────────────────────────────────────────────────────────
// COPY TO: frontend/src/pages/PostsPage.js
// Then add this route in App.js:
//   import PostsPage from "./pages/PostsPage";
//   <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import {
  createPostApi,
  getMyPostsApi,
  updatePostApi,
  deletePostApi,
} from "../api/post.api";
import { useAuth } from "../context/AuthContext";
import "./PostsPage.css";

// ── Blank form state ───────────────────────────────────────────────────────
const BLANK = {
  caption:    "",
  visibility: "public",
  tags:       "",   // user types comma-separated; we split before sending
  type:       "text",
};

export default function PostsPage() {
  const { user } = useAuth();

  // ── Form state ─────────────────────────────────────────────────────────
  const [form,       setForm]       = useState(BLANK);
  const [editingId,  setEditingId]  = useState(null); // null = create mode
  const [formError,  setFormError]  = useState(null);
  const [formOk,     setFormOk]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Feed state ─────────────────────────────────────────────────────────
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [feedError,setFeedError]= useState(null);
  const [page,     setPage]     = useState(1);
  const [totalPages,setTotalPages] = useState(1);

  // ── Load my posts ──────────────────────────────────────────────────────
  const loadPosts = useCallback(async (p = 1) => {
    setLoading(true);
    setFeedError(null);
    try {
      const { data } = await getMyPostsApi(p, 10);
      setPosts(data.data.posts);
      setTotalPages(data.data.pagination.pages);
      setPage(p);
    } catch {
      setFeedError("Could not load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(1); }, [loadPosts]);

  // ── Form field change ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Submit (create or update) ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    setSubmitting(true);

    // Convert comma-separated tags string → clean array
    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await updatePostApi(editingId, payload);
        setFormOk("Post updated successfully!");
        setEditingId(null);
      } else {
        await createPostApi(payload);
        setFormOk("Post created successfully!");
      }
      setForm(BLANK);
      loadPosts(1);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setFormError(
        apiErrors
          ? apiErrors.map((e) => e.message).join(" · ")
          : err.response?.data?.message || "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Start editing a post ───────────────────────────────────────────────
  const handleEdit = (post) => {
    setEditingId(post._id);
    setForm({
      caption:    post.caption,
      visibility: post.visibility,
      tags:       post.tags.join(", "),
      type:       post.type,
    });
    setFormError(null);
    setFormOk(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Cancel edit ────────────────────────────────────────────────────────
  const handleCancel = () => {
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
    setFormOk(null);
  };

  // ── Delete a post ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePostApi(id);
      loadPosts(page);
    } catch {
      alert("Could not delete post. Please try again.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="posts-page">

      {/* ── Create / Edit Form ── */}
      <section className="post-form-section">
        <h2>{editingId ? "Edit Post" : "Create Post"}</h2>

        {formError && <div className="alert alert-error">{formError}</div>}
        {formOk    && <div className="alert alert-success">{formOk}</div>}

        <form onSubmit={handleSubmit} className="post-form" noValidate>

          {/* Read-only info row */}
          <div className="form-row two-col">
            <div className="field-group readonly">
              <label>Post ID (_id)</label>
              <input value={editingId || "Auto-generated on create"} readOnly />
            </div>
            <div className="field-group readonly">
              <label>User ID</label>
              <input value={user?.id || ""} readOnly />
            </div>
          </div>

          {/* Caption */}
          <div className="field-group">
            <label htmlFor="caption">
              Caption
              <span className="char-count">{form.caption.length}/2200</span>
            </label>
            <textarea
              id="caption"
              name="caption"
              rows={4}
              maxLength={2200}
              placeholder="What's on your mind?"
              value={form.caption}
              onChange={handleChange}
            />
          </div>

          {/* Type + Visibility */}
          <div className="form-row two-col">
            <div className="field-group">
              <label htmlFor="type">Post Type</label>
              <select id="type" name="type" value={form.type} onChange={handleChange}>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="repost">Repost</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="visibility">Visibility</label>
              <select id="visibility" name="visibility" value={form.visibility} onChange={handleChange}>
                <option value="public">🌐 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="field-group">
            <label htmlFor="tags">
              Tags
              <span className="hint">Comma-separated, e.g. nodejs, react, security</span>
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              placeholder="nodejs, react, security"
              value={form.tags}
              onChange={handleChange}
            />
          </div>

          {/* Engagement counters — read-only, server-managed */}
          <div className="form-row four-col">
            {[
              { label: "Likes",    key: "likesCount" },
              { label: "Comments", key: "commentsCount" },
              { label: "Shares",   key: "shareCount" },
              { label: "Reposts",  key: "repostCount" },
            ].map(({ label, key }) => (
              <div className="field-group readonly" key={key}>
                <label>{label}</label>
                <input
                  value={editingId
                    ? (posts.find((p) => p._id === editingId)?.[key] ?? 0)
                    : 0}
                  readOnly
                  title="Managed by server"
                />
              </div>
            ))}
          </div>
          <p className="counter-note">
            ℹ️ Engagement counters are managed by the server and cannot be set manually.
          </p>

          {/* Actions */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting
                ? editingId ? "Saving…" : "Publishing…"
                : editingId ? "Save Changes" : "Publish Post"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── My Posts Feed ── */}
      <section className="posts-feed-section">
        <h2>My Posts</h2>

        {feedError && <div className="alert alert-error">{feedError}</div>}

        {loading ? (
          <div className="feed-loading">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">No posts yet. Create your first one above!</div>
        ) : (
          <>
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => loadPosts(page - 1)}
                  disabled={page <= 1}
                  className="btn-page"
                >← Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => loadPosts(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-page"
                >Next →</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post, onEdit, onDelete }) {
  const VISIBILITY_ICON = { public: "🌐", friends: "👥", private: "🔒" };
  const TYPE_ICON       = { text: "📝", image: "🖼️", video: "🎬", link: "🔗", repost: "🔁" };

  return (
    <div className="post-card">
      <div className="post-card-header">
        <div className="post-meta">
          <span className="post-type-badge">{TYPE_ICON[post.type]} {post.type}</span>
          <span className="post-visibility">{VISIBILITY_ICON[post.visibility]} {post.visibility}</span>
        </div>
        <div className="post-card-actions">
          <button className="btn-edit"   onClick={() => onEdit(post)}>Edit</button>
          <button className="btn-delete" onClick={() => onDelete(post._id)}>Delete</button>
        </div>
      </div>

      {/* IDs */}
      <div className="post-ids">
        <span title={post._id}>ID: {post._id.slice(-8)}…</span>
        <span title={post.userId?._id || post.userId}>User: {(post.userId?._id || post.userId || "").toString().slice(-8)}…</span>
      </div>

      {/* Caption */}
      {post.caption && <p className="post-caption">{post.caption}</p>}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Engagement counters */}
      <div className="post-counters">
        <span>❤️ {post.likesCount}</span>
        <span>💬 {post.commentsCount}</span>
        <span>↗️ {post.shareCount}</span>
        <span>🔁 {post.repostCount}</span>
      </div>

      <div className="post-date">
        {new Date(post.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
