package utils

import (
	"log"
	"sync"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// Task represents a unit of work to be processed by the worker pool
type Task struct {
	Process func() ([]byte, error)
	Result  chan TaskResult
}

// TaskResult represents the result of a task execution
type TaskResult struct {
	Data  []byte
	Error error
}

// WorkerPool manages a pool of workers for concurrent task processing
type WorkerPool struct {
	taskQueue   chan Task
	workerCount int
	wg          sync.WaitGroup
	once        sync.Once
}

var (
	globalPool *WorkerPool
	poolMutex  sync.Mutex
)

// InitWorkerPool initializes the global worker pool with the specified configuration
func InitWorkerPool(cfg *config.Config) *WorkerPool {
	poolMutex.Lock()
	defer poolMutex.Unlock()

	if globalPool == nil {
		globalPool = &WorkerPool{
			taskQueue:   make(chan Task, cfg.WorkerPoolSize*2), // Buffer size is double the worker count
			workerCount: cfg.WorkerPoolSize,
		}
		globalPool.start()
		log.Printf("Worker pool initialized with %d workers and queue size %d",
			cfg.WorkerPoolSize, cfg.WorkerPoolSize*2)
	}
	return globalPool
}

// GetWorkerPool returns the global worker pool instance
func GetWorkerPool() *WorkerPool {
	poolMutex.Lock()
	defer poolMutex.Unlock()

	if globalPool == nil {
		log.Printf("Warning: Worker pool accessed before initialization, using default configuration")
		// Use a default configuration if not initialized
		defaultCfg := &config.Config{WorkerPoolSize: 10}
		globalPool = &WorkerPool{
			taskQueue:   make(chan Task, defaultCfg.WorkerPoolSize*2),
			workerCount: defaultCfg.WorkerPoolSize,
		}
		globalPool.start()
	}
	return globalPool
}

// start launches worker goroutines
func (p *WorkerPool) start() {
	p.once.Do(func() {
		p.wg.Add(p.workerCount)
		for i := 0; i < p.workerCount; i++ {
			go p.worker(i)
		}
	})
}

// worker processes tasks from the queue
func (p *WorkerPool) worker(id int) {
	defer p.wg.Done()

	log.Printf("Worker %d started", id)

	for task := range p.taskQueue {
		data, err := task.Process()
		task.Result <- TaskResult{Data: data, Error: err}
		close(task.Result)
	}

	log.Printf("Worker %d stopped", id)
}

// Submit adds a task to the worker pool queue and returns a channel for the result
func (p *WorkerPool) Submit(process func() ([]byte, error)) <-chan TaskResult {
	resultChan := make(chan TaskResult, 1)
	p.taskQueue <- Task{
		Process: process,
		Result:  resultChan,
	}
	return resultChan
}

// ProcessTask submits a task to the worker pool and waits for the result
func (p *WorkerPool) ProcessTask(process func() ([]byte, error)) ([]byte, error) {
	resultChan := p.Submit(process)
	result := <-resultChan
	return result.Data, result.Error
}

// Shutdown gracefully stops the worker pool after all tasks are processed
func (p *WorkerPool) Shutdown() {
	close(p.taskQueue)
	p.wg.Wait()
	log.Printf("Worker pool shutdown complete")
}
