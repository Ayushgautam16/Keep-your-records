class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.filteredTodos = [...this.todos];
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.initializeElements();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
    }
    
    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.searchInput = document.getElementById('searchInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.categorySelect = document.getElementById('categorySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }
    
    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterTodos();
        });
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });
        
        // Set default due date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.dueDateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    setActiveFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.filterTodos();
    }
    
    filterTodos() {
        this.filteredTodos = this.todos.filter(todo => {
            const matchesSearch = todo.text.toLowerCase().includes(this.searchQuery);
            const matchesFilter = this.currentFilter === 'all' || 
                                (this.currentFilter === 'pending' && !todo.completed) ||
                                (this.currentFilter === 'completed' && todo.completed);
            return matchesSearch && matchesFilter;
        });
        this.renderTodos();
    }
    
    addTodo() {
        const todoText = this.todoInput.value.trim();
        if (todoText === '') return;
        
        const todo = {
            id: Date.now(),
            text: todoText,
            completed: false,
            priority: this.prioritySelect.value,
            category: this.categorySelect.value,
            dueDate: this.dueDateInput.value,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.filterTodos();
        this.updateStats();
        this.todoInput.value = '';
        this.todoInput.focus();
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.filterTodos();
            this.updateStats();
        }
    }
    
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        const newText = prompt('Edit todo:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.filterTodos();
        }
    }
    
    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this todo?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.filterTodos();
            this.updateStats();
        }
    }
    
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('pendingCount').textContent = pending;
    }
    
    renderTodos() {
        this.todoList.innerHTML = '';
        
        if (this.filteredTodos.length === 0) {
            const emptyState = this.searchQuery || this.currentFilter !== 'all' 
                ? 'No todos match your search/filter criteria.'
                : 'No todos yet. Add one above!';
            
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${emptyState}</p>
                </div>
            `;
            return;
        }
        
        this.filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            const dueDate = new Date(todo.dueDate);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const isOverdue = !todo.completed && dueDate < today && dueDate.toDateString() !== today.toDateString();
            
            li.innerHTML = `
                <div class="todo-header">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                </div>
                <div class="todo-meta">
                    <span class="meta-item">
                        <i class="fas fa-flag"></i>
                        <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-tag"></i>
                        <span class="category-badge">${todo.category}</span>
                    </span>
                    <span class="meta-item ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(todo.dueDate)}</span>
                        ${isOverdue ? ' <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>' : ''}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${this.formatRelativeTime(todo.createdAt)}</span>
                    </span>
                </div>
                <div class="todo-actions">
                    <button class="complete-btn" onclick="todoApp.toggleTodo(${todo.id})">
                        <i class="fas ${todo.completed ? 'fa-undo' : 'fa-check'}"></i>
                        ${todo.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="edit-btn" onclick="todoApp.editTodo(${todo.id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            `;
            
            this.todoList.appendChild(li);
        });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }
    
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});
