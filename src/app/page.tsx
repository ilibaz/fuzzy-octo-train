"use client";

import { NextPage } from "next";
import { useState, FormEvent } from "react";

const ApiTesterPage: NextPage = () => {
  const [nArticles, setNArticles] = useState<string>("5");
  const [keywords, setKeywords] = useState<string>("technology");
  const [searchTitle, setSearchTitle] = useState<string>("Apple");
  const [searchAuthor, setSearchAuthor] = useState<string>("John Doe");
  const [limitForAuthor, setLimitForAuthor] = useState<string>("3");

  const [results, setResults] = useState<object | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (url: string) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          data?.errors?.[0] || data?.message || `Error: ${res.status}`;
        throw new Error(errorMsg);
      }
      setResults(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNArticles = (e: FormEvent) => {
    e.preventDefault();
    fetchData(`/api/news?limit=${nArticles}`);
  };

  const handleSearchByKeyword = (e: FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) {
      setError("Keywords cannot be empty.");
      return;
    }
    fetchData(`/api/news?q=${encodeURIComponent(keywords)}&limit=${nArticles}`);
  };

  const handleSearchByTitle = (e: FormEvent) => {
    e.preventDefault();
    if (!searchTitle.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    fetchData(`/api/news/title/${encodeURIComponent(searchTitle)}`);
  };

  const handleSearchByAuthor = (e: FormEvent) => {
    e.preventDefault();
    if (!searchAuthor.trim()) {
      setError("Author cannot be empty.");
      return;
    }
    fetchData(
      `/api/news/author/${encodeURIComponent(
        searchAuthor
      )}?limit=${limitForAuthor}`
    );
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "20px auto",
        padding: "20px",
      }}
    >
      <h1 style={h1Style}>📰 News API Tester</h1>
      <br />

      <section style={sectionStyle}>
        <h2 style={h2Style}>Fetch N Articles (Top Headlines)</h2>{" "}
        <form onSubmit={handleFetchNArticles} style={formStyle}>
          <label style={labelStyle}>
            Number of articles (N):
            <input
              type="number"
              value={nArticles}
              onChange={(e) => setNArticles(e.target.value)}
              min="1"
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Fetching..." : "Fetch Articles"}
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Search by Keyword</h2>
        <form onSubmit={handleSearchByKeyword} style={formStyle}>
          <label style={labelStyle}>
            Keywords:
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              style={inputStyle}
              placeholder="e.g., AI, Next.js"
            />
          </label>
          <label style={labelStyle}>
            Max articles:
            <input
              type="number"
              value={nArticles}
              onChange={(e) => setNArticles(e.target.value)}
              min="1"
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Searching..." : "Search Keywords"}
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Search by Title</h2>
        <form onSubmit={handleSearchByTitle} style={formStyle}>
          <label style={labelStyle}>
            Article Title:
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              style={inputStyle}
              placeholder="Enter exact or partial title"
            />
          </label>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Searching..." : "Search Title"}
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Search by Author</h2>
        <form onSubmit={handleSearchByAuthor} style={formStyle}>
          <label style={labelStyle}>
            Author Name:
            <input
              type="text"
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              style={inputStyle}
              placeholder="e.g., Jane Smith"
            />
          </label>
          <label style={labelStyle}>
            Max articles to check:
            <input
              type="number"
              value={limitForAuthor}
              onChange={(e) => setLimitForAuthor(e.target.value)}
              min="1"
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Searching..." : "Search Author"}
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Results</h2>
        {loading && <p style={pStyle}>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {results && (
          <pre style={preStyle}>{JSON.stringify(results, null, 2)}</pre>
        )}
      </section>
    </div>
  );
};

const h1Style: React.CSSProperties = {
  color: "#fff",
  fontSize: "2em",
};

const h2Style: React.CSSProperties = {
  color: "#000000",
  fontSize: "1.5em",
};

const pStyle: React.CSSProperties = {
  color: "#000",
  fontSize: "1em",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "30px",
  padding: "15px",
  border: "1px solid #eee",
  borderRadius: "5px",
  backgroundColor: "#f9f9f9",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontSize: "0.9em",
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  padding: "8px",
  marginTop: "4px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "1em",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 15px",
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "1em",
};

const preStyle: React.CSSProperties = {
  backgroundColor: "#2d2d2d",
  color: "#f0f0f0",
  padding: "15px",
  borderRadius: "5px",
  overflowX: "auto",
  maxHeight: "500px",
  fontSize: "0.85em",
};

export default ApiTesterPage;
