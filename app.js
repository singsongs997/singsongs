// 数据存储管理
const STORAGE_KEYS = {
    FOODS: 'food_lottery_foods',
    HISTORY: 'food_lottery_history'
};

// 食品数据管理
class FoodManager {
    constructor() {
        this.loadFoods();
    }
    
    loadFoods() {
        const stored = localStorage.getItem(STORAGE_KEYS.FOODS);
        this.foods = stored ? JSON.parse(stored) : this.getInitialFoods();
    }
    
    getInitialFoods() {
        // 提供一些初始食品数据
        return [
            { id: 1, name: '宫保鸡丁', category: '主食', icon: 'fa-cutlery' },
            { id: 2, name: '鱼香肉丝', category: '主食', icon: 'fa-cutlery' },
            { id: 3, name: '红烧肉', category: '主食', icon: 'fa-cutlery' },
            { id: 4, name: '清蒸鱼', category: '主食', icon: 'fa-cutlery' },
            { id: 5, name: '麻婆豆腐', category: '主食', icon: 'fa-cutlery' },
            { id: 6, name: '小笼包', category: '小吃', icon: 'fa-birthday-cake' },
            { id: 7, name: '煎饼果子', category: '小吃', icon: 'fa-birthday-cake' },
            { id: 8, name: '水果沙拉', category: '水果', icon: 'fa-lemon-o' },
            { id: 9, name: '西瓜', category: '水果', icon: 'fa-lemon-o' },
            { id: 10, name: '可乐', category: '饮料', icon: 'fa-glass' },
            { id: 11, name: '奶茶', category: '饮料', icon: 'fa-coffee' },
            { id: 12, name: '绿茶', category: '饮料', icon: 'fa-coffee' }
        ];
    }
    
    saveFoods() {
        localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(this.foods));
    }
    
    addFood(food) {
        const newId = this.foods.length > 0 ? Math.max(...this.foods.map(f => f.id)) + 1 : 1;
        const newFood = { id: newId, ...food };
        this.foods.push(newFood);
        this.saveFoods();
        return newFood;
    }
    
    deleteFood(id) {
        this.foods = this.foods.filter(food => food.id !== id);
        this.saveFoods();
    }
    
    getFoods() {
        return this.foods;
    }
    
    getFoodById(id) {
        return this.foods.find(food => food.id === id);
    }
    
    getFoodsByCategory(category) {
        if (category === 'all') return this.foods;
        return this.foods.filter(food => food.category === category);
    }
}

// 历史记录管理
class HistoryManager {
    constructor() {
        this.loadHistory();
    }
    
    loadHistory() {
        const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
        this.history = stored ? JSON.parse(stored) : [];
    }
    
    saveHistory() {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    }
    
    addRecord(selectedFoods) {
        const record = {
            id: Date.now(),
            timestamp: new Date(),
            foods: selectedFoods.map(food => ({ id: food.id, name: food.name, category: food.category }))
        };
        this.history.unshift(record); // 添加到开头
        this.saveHistory();
        return record;
    }
    
    getHistory() {
        return this.history;
    }
    
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }
    
    getHistoryByCategory(category) {
        if (category === 'all') return this.history;
        return this.history.filter(record => 
            record.foods.some(food => food.category === category)
        );
    }
}

// 统计分析管理
class StatsManager {
    constructor(foodManager, historyManager) {
        this.foodManager = foodManager;
        this.historyManager = historyManager;
    }
    
    getStats() {
        const foods = this.foodManager.getFoods();
        const history = this.historyManager.getHistory();
        
        // 初始化统计数据
        const stats = foods.map(food => ({
            id: food.id,
            name: food.name,
            category: food.category,
            icon: food.icon,
            count: 0,
            probability: 0
        }));
        
        // 计算每个食品被抽中的次数
        let totalDraws = 0;
        history.forEach(record => {
            record.foods.forEach(food => {
                const stat = stats.find(s => s.id === food.id);
                if (stat) {
                    stat.count++;
                    totalDraws++;
                }
            });
        });
        
        // 计算概率
        stats.forEach(stat => {
            stat.probability = totalDraws > 0 ? (stat.count / totalDraws * 100).toFixed(1) : 0;
        });
        
        // 按被抽中次数排序
        stats.sort((a, b) => b.count - a.count);
        
        return {
            stats,
            totalDraws
        };
    }
    
    getChartData() {
        const { stats } = this.getStats();
        
        // 只取前10个被抽中最多的食品用于图表
        const topStats = stats.slice(0, 10).filter(stat => stat.count > 0);
        
        return {
            labels: topStats.map(stat => stat.name),
            datasets: [{
                label: '被抽中次数',
                data: topStats.map(stat => stat.count),
                backgroundColor: topStats.map((_, index) => {
                    const colors = ['#90725C', '#D6C0A8', '#7D8C5B', '#B0A295', '#C9B8A5'];
                    return colors[index % colors.length];
                }),
                borderWidth: 0
            }]
        };
    }
}

// 转盘抽签管理器
class LotteryManager {
    constructor(foodManager) {
        this.foodManager = foodManager;
        this.turntable = document.getElementById('turntable');
        this.turntableContent = document.getElementById('turntable-content');
    }
    
    drawFoods(count) {
        const foods = this.foodManager.getFoods();
        if (foods.length === 0) return [];
        
        // 如果食品数量少于要抽取的数量，就只返回所有食品
        if (foods.length <= count) {
            return [...foods];
        }
        
        // 随机抽取不重复的食品
        const selected = [];
        const availableIndices = [...Array(foods.length).keys()];
        
        while (selected.length < count && availableIndices.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const foodIndex = availableIndices[randomIndex];
            selected.push(foods[foodIndex]);
            availableIndices.splice(randomIndex, 1);
        }
        
        return selected;
    }
    
    // 准备转盘
    prepareTurntable(foods) {
        this.turntable.classList.remove('turntable-spin');
        
        // 创建转盘分区
        if (foods.length > 0) {
            // 简单显示食品数量
            this.turntableContent.innerHTML = `
                <div class="text-center">
                    <p class="font-chinese text-xl">${foods.length} 种选择</p>
                </div>
            `;
        } else {
            this.turntableContent.innerHTML = `
                <div class="text-center">
                    <i class="fa fa-exclamation-circle text-5xl text-red-500 mb-2"></i>
                    <p class="font-chinese text-xl">请先添加食品</p>
                </div>
            `;
        }
    }
    
    // 执行转盘动画并返回结果
    async animateDraw(foods) {
        return new Promise((resolve) => {
            // 确保转盘处于初始状态
            this.turntable.classList.remove('turntable-spin');
            
            // 强制重排
            void this.turntable.offsetWidth;
            
            // 添加动画类
            this.turntable.classList.add('turntable-spin');
            
            // 等待动画完成
            setTimeout(() => {
                resolve(foods);
            }, 3000);
        });
    }
}

// UI管理器
class UIManager {
    constructor(foodManager, historyManager, statsManager, lotteryManager) {
        this.foodManager = foodManager;
        this.historyManager = historyManager;
        this.statsManager = statsManager;
        this.lotteryManager = lotteryManager;
        
        // 页面元素
        this.pages = {
            draw: document.getElementById('draw-page'),
            manage: document.getElementById('manage-page'),
            history: document.getElementById('history-page'),
            stats: document.getElementById('stats-page')
        };
        
        this.navButtons = {
            draw: document.getElementById('nav-draw'),
            manage: document.getElementById('nav-manage'),
            history: document.getElementById('nav-history'),
            stats: document.getElementById('nav-stats')
        };
        
        // 初始化图表
        this.chart = null;
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化UI
        this.initUI();
    }
    
    bindEvents() {
        // 导航按钮事件
        Object.keys(this.navButtons).forEach(key => {
            this.navButtons[key].addEventListener('click', () => {
                this.showPage(key);
            });
        });
        
        // 抽签按钮事件
        document.getElementById('draw-button').addEventListener('click', () => {
            this.handleDraw();
        });
        
        // 抽取数量滑块事件
        document.getElementById('draw-count').addEventListener('input', (e) => {
            document.getElementById('draw-count-value').textContent = e.target.value;
        });
        
        // 添加食品按钮事件
        document.getElementById('add-food-button').addEventListener('click', () => {
            this.handleAddFood();
        });
        
        // 图标选择器事件
        document.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // 移除其他选中状态
                document.querySelectorAll('.icon-option').forEach(opt => {
                    opt.classList.remove('border-primary', 'bg-secondary/20');
                    opt.classList.add('border-secondary');
                });
                
                // 设置当前选中状态
                e.currentTarget.classList.remove('border-secondary');
                e.currentTarget.classList.add('border-primary', 'bg-secondary/20');
                
                // 保存选中的图标
                const icon = e.currentTarget.getAttribute('data-icon');
                document.getElementById('selected-icon').value = icon;
            });
        });
        
        // 筛选历史记录事件
        document.getElementById('history-category-filter').addEventListener('change', () => {
            this.renderHistoryList();
        });
        
        // 清空历史记录事件
        document.getElementById('clear-history').addEventListener('click', () => {
            if (confirm('确定要清空所有历史记录吗？')) {
                this.historyManager.clearHistory();
                this.renderHistoryList();
            }
        });
    }
    
    initUI() {
        // 默认显示抽签页面
        this.showPage('draw');
        
        // 初始化食品列表
        this.renderFoodList();
        
        // 初始化历史记录
        this.renderHistoryList();
        
        // 初始化转盘
        this.lotteryManager.prepareTurntable(this.foodManager.getFoods());
    }
    
    showPage(pageName) {
        // 隐藏所有页面
        Object.values(this.pages).forEach(page => {
            page.classList.add('hidden');
        });
        
        // 移除所有导航按钮的选中状态
        Object.values(this.navButtons).forEach(button => {
            button.classList.remove('bg-primary', 'text-white');
            button.classList.add('bg-background/70', 'text-primary');
        });
        
        // 显示选中的页面和导航按钮
        this.pages[pageName].classList.remove('hidden');
        this.navButtons[pageName].classList.remove('bg-background/70', 'text-primary');
        this.navButtons[pageName].classList.add('bg-primary', 'text-white');
        
        // 特殊处理统计页面
        if (pageName === 'stats') {
            this.renderStats();
        }
    }
    
    async handleDraw() {
        const count = parseInt(document.getElementById('draw-count').value);
        const foods = this.foodManager.getFoods();
        
        if (foods.length === 0) {
            alert('请先添加食品！');
            this.showPage('manage');
            return;
        }
        
        // 禁用抽签按钮防止重复点击
        const drawButton = document.getElementById('draw-button');
        drawButton.disabled = true;
        drawButton.textContent = '抽签中...';
        
        // 抽取食品
        const selectedFoods = this.lotteryManager.drawFoods(count);
        
        // 执行动画
        await this.lotteryManager.animateDraw(selectedFoods);
        
        // 保存到历史记录
        this.historyManager.addRecord(selectedFoods);
        
        // 显示结果
        this.renderDrawResult(selectedFoods);
        
        // 更新历史记录和统计
        this.renderHistoryList();
        
        // 恢复按钮状态
        drawButton.disabled = false;
        drawButton.textContent = '开始抽签';
    }
    
    renderDrawResult(foods) {
        const resultContainer = document.getElementById('result-container');
        const drawResult = document.getElementById('draw-result');
        
        // 清空结果容器
        resultContainer.innerHTML = '';
        
        // 添加结果卡片
        foods.forEach((food, index) => {
            setTimeout(() => {
                const card = document.createElement('div');
                card.className = 'dish-card bg-white rounded-lg p-4 shadow-md ink-border result-reveal flex flex-col items-center';
                card.innerHTML = `
                    <i class="fa ${food.icon} text-4xl text-primary mb-3"></i>
                    <h3 class="font-calligraphy text-2xl text-accent mb-1">${food.name}</h3>
                    <p class="text-sm text-text/70">${food.category}</p>
                `;
                resultContainer.appendChild(card);
            }, index * 200);
        });
        
        // 显示结果区域
        drawResult.classList.remove('hidden');
        
        // 滚动到结果区域
        setTimeout(() => {
            drawResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
    
    handleAddFood() {
        const name = document.getElementById('food-name').value.trim();
        const category = document.getElementById('food-category').value;
        const icon = document.getElementById('selected-icon').value;
        
        if (!name) {
            alert('请输入食品名称！');
            return;
        }
        
        // 添加食品
        this.foodManager.addFood({ name, category, icon });
        
        // 清空输入
        document.getElementById('food-name').value = '';
        
        // 更新食品列表
        this.renderFoodList();
        
        // 更新转盘
        this.lotteryManager.prepareTurntable(this.foodManager.getFoods());
    }
    
    renderFoodList() {
        const foodList = document.getElementById('food-list');
        const foods = this.foodManager.getFoods();
        
        // 清空列表
        foodList.innerHTML = '';
        
        // 添加食品卡片
        foods.forEach(food => {
            const card = document.createElement('div');
            card.className = 'dish-card bg-white rounded-lg p-3 shadow-sm ink-border flex justify-between items-center';
            card.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i class="fa ${food.icon} text-xl text-primary"></i>
                    <div>
                        <p class="font-chinese">${food.name}</p>
                        <p class="text-xs text-text/70">${food.category}</p>
                    </div>
                </div>
                <button class="delete-food text-red-500 hover:text-red-700" data-id="${food.id}">
                    <i class="fa fa-trash"></i>
                </button>
            `;
            foodList.appendChild(card);
        });
        
        // 添加删除事件
        document.querySelectorAll('.delete-food').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.foodManager.deleteFood(id);
                this.renderFoodList();
                this.lotteryManager.prepareTurntable(this.foodManager.getFoods());
            });
        });
    }
    
    renderHistoryList() {
        const historyList = document.getElementById('history-list');
        const noHistory = document.getElementById('no-history');
        const category = document.getElementById('history-category-filter').value;
        const history = this.historyManager.getHistoryByCategory(category);
        
        // 清空列表
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            noHistory.classList.remove('hidden');
        } else {
            noHistory.classList.add('hidden');
            
            // 添加历史记录项
            history.forEach(record => {
                const item = document.createElement('div');
                item.className = 'bg-secondary/20 rounded-lg p-3 ink-border';
                
                // 格式化时间
                const date = new Date(record.timestamp);
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                // 创建食品列表
                const foodItems = record.foods.map(food => 
                    `<span class="inline-block bg-white/70 px-2 py-1 rounded-md m-1 text-sm">${food.name}</span>`
                ).join('');
                
                item.innerHTML = `
                    <p class="text-sm text-text/70 mb-2">${formattedDate}</p>
                    <div class="flex flex-wrap">
                        ${foodItems}
                    </div>
                `;
                
                historyList.appendChild(item);
            });
        }
    }
    
    renderStats() {
        const statsDetail = document.getElementById('stats-detail');
        const noStats = document.getElementById('no-stats');
        const { stats, totalDraws } = this.statsManager.getStats();
        
        // 清空详细统计
        statsDetail.innerHTML = '';
        
        if (totalDraws === 0) {
            noStats.classList.remove('hidden');
        } else {
            noStats.classList.add('hidden');
            
            // 添加统计信息
            stats.forEach(stat => {
                const item = document.createElement('div');
                item.className = 'flex justify-between items-center bg-secondary/20 rounded-lg p-3 ink-border';
                item.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <i class="fa ${stat.icon} text-lg text-primary"></i>
                        <div>
                            <p class="font-chinese">${stat.name}</p>
                            <p class="text-xs text-text/70">${stat.category}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-calligraphy text-xl text-accent">${stat.count}次</p>
                        <p class="text-xs text-text/70">${stat.probability}%</p>
                    </div>
                `;
                statsDetail.appendChild(item);
            });
        }
        
        // 更新图表
        this.updateChart();
    }
    
    updateChart() {
        const ctx = document.getElementById('stats-chart').getContext('2d');
        const chartData = this.statsManager.getChartData();
        
        // 如果已经有图表，先销毁
        if (this.chart) {
            this.chart.destroy();
        }
        
        // 创建新图表
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(144, 114, 92, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#D6C0A8',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(144, 114, 92, 0.1)'
                        },
                        ticks: {
                            color: '#5C4E3D'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#5C4E3D'
                        }
                    }
                }
            }
        });
    }
}

// 应用入口
function initApp() {
    // 创建各个管理器
    const foodManager = new FoodManager();
    const historyManager = new HistoryManager();
    const statsManager = new StatsManager(foodManager, historyManager);
    const lotteryManager = new LotteryManager(foodManager);
    
    // 创建UI管理器
    const uiManager = new UIManager(foodManager, historyManager, statsManager, lotteryManager);
    
    // 监听窗口大小变化，更新图表
    window.addEventListener('resize', () => {
        if (document.getElementById('stats-page').classList.contains('hidden')) {
            uiManager.renderStats();
        }
    });
}

// 当页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', initApp);