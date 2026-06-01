package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

// Item represents a task item.
type Item struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	Priority  string    `json:"priority,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Store is an in-memory data store for items.
type Store struct {
	mu    sync.RWMutex
	items []Item
}

var startTime = time.Now()

// NewStore creates a pre-populated item store.
func NewStore() *Store {
	now := time.Now()
	return &Store{
		items: []Item{
			{ID: "1", Title: "Setup CI pipeline", Status: "done", Priority: "high", CreatedAt: now.Add(-72 * time.Hour), UpdatedAt: now.Add(-48 * time.Hour)},
			{ID: "2", Title: "Add authentication middleware", Status: "in_progress", Priority: "high", CreatedAt: now.Add(-48 * time.Hour), UpdatedAt: now.Add(-12 * time.Hour)},
			{ID: "3", Title: "Write API documentation", Status: "todo", Priority: "medium", CreatedAt: now.Add(-24 * time.Hour), UpdatedAt: now.Add(-24 * time.Hour)},
			{ID: "4", Title: "Add WebSocket notifications", Status: "done", Priority: "medium", CreatedAt: now.Add(-96 * time.Hour), UpdatedAt: now.Add(-72 * time.Hour)},
			{ID: "5", Title: "Implement rate limiting", Status: "done", Priority: "high", CreatedAt: now.Add(-120 * time.Hour), UpdatedAt: now.Add(-96 * time.Hour)},
			{ID: "6", Title: "Configure Grafana monitoring", Status: "in_progress", Priority: "medium", CreatedAt: now.Add(-36 * time.Hour), UpdatedAt: now.Add(-6 * time.Hour)},
			{ID: "7", Title: "Add health check endpoints", Status: "done", Priority: "high", CreatedAt: now.Add(-144 * time.Hour), UpdatedAt: now.Add(-120 * time.Hour)},
			{ID: "8", Title: "Setup CHANGELOG generation", Status: "in_progress", Priority: "low", CreatedAt: now.Add(-60 * time.Hour), UpdatedAt: now.Add(-24 * time.Hour)},
			{ID: "9", Title: "Optimize SQL queries", Status: "in_progress", Priority: "critical", CreatedAt: now.Add(-48 * time.Hour), UpdatedAt: now.Add(-3 * time.Hour)},
			{ID: "10", Title: "Add CI dependency caching", Status: "in_progress", Priority: "medium", CreatedAt: now.Add(-24 * time.Hour), UpdatedAt: now.Add(-1 * time.Hour)},
			{ID: "11", Title: "Integrate CodeQL scanning", Status: "todo", Priority: "high", CreatedAt: now.Add(-12 * time.Hour), UpdatedAt: now.Add(-12 * time.Hour)},
			{ID: "12", Title: "Fix WebSocket memory leak", Status: "in_progress", Priority: "critical", CreatedAt: now.Add(-36 * time.Hour), UpdatedAt: now.Add(-6 * time.Hour)},
			{ID: "13", Title: "Docker multi-stage build", Status: "done", Priority: "medium", CreatedAt: now.Add(-168 * time.Hour), UpdatedAt: now.Add(-144 * time.Hour)},
		},
	}
}

// cors wraps a handler with CORS headers.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	store := NewStore()
	mux := http.NewServeMux()

	// Health & readiness
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status": "ok",
			"uptime": time.Since(startTime).String(),
		})
	})

	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status": "ready",
			"checks": map[string]string{
				"store": "ok",
			},
		})
	})

	// Items CRUD
	mux.HandleFunc("GET /api/items", func(w http.ResponseWriter, r *http.Request) {
		store.mu.RLock()
		defer store.mu.RUnlock()

		// Filter by status if provided
		status := r.URL.Query().Get("status")
		if status != "" {
			filtered := make([]Item, 0)
			for _, item := range store.items {
				if item.Status == status {
					filtered = append(filtered, item)
				}
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(filtered)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(store.items)
	})

	mux.HandleFunc("POST /api/items", func(w http.ResponseWriter, r *http.Request) {
		var item Item
		if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		if item.Title == "" {
			http.Error(w, `{"error":"title is required"}`, http.StatusBadRequest)
			return
		}
		now := time.Now()
		item.CreatedAt = now
		item.UpdatedAt = now
		if item.Status == "" {
			item.Status = "todo"
		}
		store.mu.Lock()
		store.items = append(store.items, item)
		store.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(item)
	})

	mux.HandleFunc("PUT /api/items/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		var update Item
		if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}

		store.mu.Lock()
		defer store.mu.Unlock()
		for i, item := range store.items {
			if item.ID == id {
				if update.Title != "" {
					store.items[i].Title = update.Title
				}
				if update.Status != "" {
					store.items[i].Status = update.Status
				}
				if update.Priority != "" {
					store.items[i].Priority = update.Priority
				}
				store.items[i].UpdatedAt = time.Now()
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(store.items[i])
				return
			}
		}
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
	})

	mux.HandleFunc("DELETE /api/items/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		store.mu.Lock()
		defer store.mu.Unlock()
		for i, item := range store.items {
			if item.ID == id {
				store.items = append(store.items[:i], store.items[i+1:]...)
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
	})

	// Stats endpoint
	mux.HandleFunc("GET /api/stats", func(w http.ResponseWriter, r *http.Request) {
		store.mu.RLock()
		defer store.mu.RUnlock()

		counts := map[string]int{"total": len(store.items)}
		for _, item := range store.items {
			counts[item.Status]++
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(counts)
	})

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", cors(mux)))
}
