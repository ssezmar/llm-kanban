package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

type Item struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Store struct {
	mu    sync.RWMutex
	items []Item
}

func NewStore() *Store {
	return &Store{
		items: []Item{
			{ID: "1", Title: "Setup CI pipeline", Status: "done", CreatedAt: time.Now().Add(-48 * time.Hour)},
			{ID: "2", Title: "Add authentication", Status: "in_progress", CreatedAt: time.Now().Add(-24 * time.Hour)},
			{ID: "3", Title: "Write API docs", Status: "todo", CreatedAt: time.Now()},
		},
	}
}

func main() {
	store := NewStore()
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	mux.HandleFunc("GET /api/items", func(w http.ResponseWriter, r *http.Request) {
		store.mu.RLock()
		defer store.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(store.items)
	})

	mux.HandleFunc("POST /api/items", func(w http.ResponseWriter, r *http.Request) {
		var item Item
		if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		item.CreatedAt = time.Now()
		store.mu.Lock()
		store.items = append(store.items, item)
		store.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(item)
	})

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
