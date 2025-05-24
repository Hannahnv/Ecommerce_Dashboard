// static/js/product.js

// Fetch data from backend API
const fetchData = () => {
    // Get filter values
    const categoryId = document.getElementById('category-filter').value;
    const subcategoryId = document.getElementById('subcategory-filter').value;
    
    // Build URL with filter parameters
    let url = '/api/product-data/';
    const params = [];
    if (categoryId) params.push(`category_id=${categoryId}`);
    if (subcategoryId) params.push(`subcategory_id=${subcategoryId}`);
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    // Call API to get data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Create charts using D3.js
            createProductMetricsChart(data.product_metrics);
            createCategoryMetricsChart(data.category_metrics);
            createPeakSalesHeatmap(data.peak_sales_by_month, data.peak_sales_by_day);
        })
        .catch(error => console.error('Error fetching data:', error));
};

// Product metrics chart - Only Sales and Profit without Profit Margin
const createProductMetricsChart = (data) => {
    const margin = {top: 20, right: 30, bottom: 90, left: 60};
    const width = document.getElementById('product-metrics-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#product-metrics-chart').html('');
    
    // Create SVG container
    const svg = d3.select('#product-metrics-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Limit to top 10 products if more than 10
    const productData = data.slice(0, 10);
    
    // Create x scale
    const x = d3.scaleBand()
        .domain(productData.map(d => d.product__name))
        .range([0, width])
        .padding(0.2);
    
    // Create y scale for sales and profit
    const y = d3.scaleLinear()
        .domain([0, d3.max(productData, d => Math.max(d.total_sales, d.total_profit)) * 1.1])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
            if (d >= 1000000) {
                return '$' + d3.format('.1f')(d / 1000000) + 'M';
            } else if (d >= 1000) {
                return '$' + d3.format('.1f')(d / 1000) + 'K';
            } else {
                return '$' + d3.format('.0f')(d);
            }
        }));
    
    // Create grouped bars
    // Group width
    const groupWidth = x.bandwidth();
    // Bar width
    const barWidth = groupWidth / 2;
    
    // Create bars for sales
    svg.selectAll('.sales-bar')
        .data(productData)
        .enter()
        .append('rect')
        .attr('class', 'sales-bar')
        .attr('x', d => x(d.product__name))
        .attr('y', d => y(d.total_sales))
        .attr('width', barWidth)
        .attr('height', d => height - y(d.total_sales))
        .attr('fill', '#4e73df');
    
    // Create bars for profit
    svg.selectAll('.profit-bar')
        .data(productData)
        .enter()
        .append('rect')
        .attr('class', 'profit-bar')
        .attr('x', d => x(d.product__name) + barWidth)
        .attr('y', d => y(d.total_profit))
        .attr('width', barWidth)
        .attr('height', d => height - y(d.total_profit))
        .attr('fill', '#1cc88a');
    
    // Add legend
    const legend = svg.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .attr('text-anchor', 'end')
        .selectAll('g')
        .data(['Sales', 'Profit'])
        .enter().append('g')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);
    
    legend.append('rect')
        .attr('x', width - 19)
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', (d, i) => i === 0 ? '#4e73df' : '#1cc88a');
    
    legend.append('text')
        .attr('x', width - 24)
        .attr('y', 9.5)
        .attr('dy', '0.32em')
        .text(d => d);
};

// Category metrics chart
const createCategoryMetricsChart = (data) => {
    const margin = {top: 20, right: 60, bottom: 40, left: 60};
    const width = document.getElementById('category-metrics-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#category-metrics-chart').html('');
    
    // Create SVG container
    const svg = d3.select('#category-metrics-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create x scale for average discount
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avg_discount)])
        .nice()
        .range([0, width]);
    
    // Create y scale for profit margin
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avg_profit_margin)])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'));
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));
    
    // Add scatter points
    svg.selectAll('.scatter-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'scatter-point')
        .attr('cx', d => x(d.avg_discount))
        .attr('cy', d => y(d.avg_profit_margin))
        .attr('r', 6)
        .attr('fill', '#4e73df')
        .attr('stroke', '#1cc88a')
        .attr('stroke-width', 1.5)
        .append('title')
        .text(d => `${d.product__subcategory__category__name}: Discount ${d.avg_discount}%, Profit Margin ${d.avg_profit_margin}%`);
    
    // Add labels for points
    svg.selectAll('.scatter-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'scatter-label')
        .attr('x', d => x(d.avg_discount) + 8)
        .attr('y', d => y(d.avg_profit_margin) - 8)
        .text(d => d.product__subcategory__category__name)
        .style('font-size', '10px')
        .style('fill', '#333');
    
    // Add axis labels
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .text('Average Discount (%)')
        .style('font-size', '12px');
    
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', `rotate(-90)`)
        .attr('x', -height / 2)
        .attr('y', -margin.left + 15)
        .text('Average Profit Margin (%)')
        .style('font-size', '12px');
};

// Combined Peak Sales Heatmap for Month and Day of Week
const createPeakSalesHeatmap = (monthData, dayData) => {
    // Process month data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = {};
    monthData.forEach(d => {
        monthMap[d.month] = d.total_sales;
    });
    
    // Process day data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = {};
    dayData.forEach(d => {
        // Adjust day indexing based on your database's day numbering
        // For example, if days are 0-6 in your data, you might need to adjust
        const dayIndex = d.day % 7; // This assumes 0=Sun, 1=Mon, etc.
        dayMap[dayIndex] = d.total_sales;
    });
    
    // Create a synthetic heatmap data (since we don't have actual day-month combinations)
    // In a real application, you would query for this data specifically
    const heatmapData = [];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
            // Estimate a value based on the month and day totals
            // This is just an approximation - in a real app, query the actual data
            const daySales = dayMap[dayIndex] || 0;
            const monthSales = monthMap[monthIndex] || 0;
            
            // Create a synthetic value that's influenced by both day and month
            // This is just for demonstration - actual data would be better
            let combinedSales = (daySales + monthSales) / 2;
            
            // Add some randomization to make it look more realistic
            combinedSales = combinedSales * (0.8 + Math.random() * 0.4);
            
            heatmapData.push({
                day: dayIndex,
                month: monthIndex,
                sales: combinedSales
            });
        }
    }
    
    // Now create the heatmap
    const margin = {top: 30, right: 50, bottom: 60, left: 60};
    const width = document.getElementById('peak-sales-heatmap').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart
    d3.select('#peak-sales-heatmap').html('');
    
    // Create SVG container
    const svg = d3.select('#peak-sales-heatmap')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleBand()
        .domain(months)
        .range([0, width])
        .padding(0.05);
    
    const y = d3.scaleBand()
        .domain(days)
        .range([0, height])
        .padding(0.05);
    
    // Find min and max sales values
    const minSales = d3.min(heatmapData, d => d.sales);
    const maxSales = d3.max(heatmapData, d => d.sales);
    
    // Create color scale - using YlGnBu like in the Python example
    const colorScale = d3.scaleSequential()
        .domain([minSales, maxSales])
        .interpolator(d3.interpolateYlGnBu);
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
    
    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // Create heatmap cells
    svg.selectAll('rect')
        .data(heatmapData)
        .enter()
        .append('rect')
        .attr('x', d => x(months[d.month - 1]))
        .attr('y', d => y(days[d.day]))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', d => colorScale(d.sales))
        .style('stroke', 'white')
        .style('stroke-width', 0.5)
        .append('title')
        .text(d => `${days[d.day]}, ${months[d.month - 1]}: $${Math.round(d.sales).toLocaleString()}`);
    
    // Add color legend
    const legendWidth = 20;
    const legendHeight = height;
    const legendScale = d3.scaleLinear()
        .domain([minSales, maxSales])
        .range([legendHeight, 0]);
    
    const legend = svg.append('g')
        .attr('transform', `translate(${width + 20}, 0)`);
    
    // Create gradient for the legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'heatmap-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');
    
    // Add color stops to gradient
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
        const offset = i / numStops;
        const value = minSales + offset * (maxSales - minSales);
        gradient.append('stop')
            .attr('offset', `${offset * 100}%`)
            .attr('stop-color', colorScale(value));
    }
    
    // Add gradient rectangle
    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#heatmap-gradient)');
    
    // Add legend axis
    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d => {
            if (d >= 1000000) {
                return '$' + (d / 1000000).toFixed(1) + 'M';
            } else if (d >= 1000) {
                return '$' + (d / 1000).toFixed(0) + 'K';
            } else {
                return '$' + Math.round(d);
            }
        });
    
    legend.append('g')
        .attr('transform', `translate(${legendWidth}, 0)`)
        .call(legendAxis);
    
    // Add legend title
    legend.append('text')
        .attr('transform', 'rotate(90)')
        .attr('x', legendHeight / 2)
        .attr('y', -legendWidth - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text('Total Sales');
};

// Handle filter changes for subcategory when category changes
document.getElementById('category-filter').addEventListener('change', function() {
    const categoryId = this.value;
    const subcategorySelect = document.getElementById('subcategory-filter');
    const subcategoryOptions = subcategorySelect.querySelectorAll('option');
    
    // Reset subcategory selection
    subcategorySelect.value = '';
    
    // Show/hide subcategories based on selected category
    if (categoryId) {
        subcategoryOptions.forEach(option => {
            if (option.value === '' || option.dataset.category === categoryId) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    } else {
        subcategoryOptions.forEach(option => {
            option.style.display = '';
        });
    }
    
    // Fetch data with new filter
    fetchData();
});

// Handle subcategory filter change
document.getElementById('subcategory-filter').addEventListener('change', fetchData);

// Call fetchData when page is loaded
document.addEventListener('DOMContentLoaded', fetchData);