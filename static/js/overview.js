// static/js/overview.js

// Fetch data from backend API
const fetchData = () => {
    // Get filter values
    const year = document.getElementById('year-filter').value;
    const quarter = document.getElementById('quarter-filter').value;
    const month = document.getElementById('month-filter').value;
    
    // Build URL with filter parameters
    let url = '/api/overview-data/';
    const params = [];
    if (year) params.push(`year=${year}`);
    if (quarter) params.push(`quarter=${quarter}`);
    if (month) params.push(`month=${month}`);
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    // Call API to get data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Update KPIs with formatted values
            updateKPIs(data.kpi);
            
            // Create charts using D3.js
            createSalesByMarketChart(data.sales_by_market);
            createQuantityByYearChart(data.quantity_by_year);
            createProfitByCategoryChart(data.profit_by_category);
            createSalesBySegmentChart(data.sales_by_segment);
            createOrderQuantityDistributionChart(data.order_quantity_distribution);
        })
        .catch(error => console.error('Error fetching data:', error));
};

// Format numbers for KPIs
const formatNumber = (value) => {
    if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    } else {
        return '$' + value.toFixed(1);
    }
};

// Format quantity 
const formatQuantity = (value) => {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    } else {
        return value.toFixed(0);
    }
};

// Update KPIs
const updateKPIs = (kpi) => {
    document.getElementById('total-sales').textContent = formatNumber(kpi.total_sales);
    document.getElementById('total-profit').textContent = formatNumber(kpi.total_profit);
    document.getElementById('total-quantity').textContent = formatQuantity(kpi.total_quantity);
};

// Sales by Market chart
const createSalesByMarketChart = (data) => {
    const margin = {top: 20, right: 30, bottom: 90, left: 60};
    const width = document.getElementById('sales-by-market-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#sales-by-market-chart').html('');
    
    // Create SVG container
    const svg = d3.select('#sales-by-market-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create x scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.order__city__state__country__market__name))
        .range([0, width])
        .padding(0.3);
    
    // Create y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_sales)])
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
    
    // Create bars
    svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.order__city__state__country__market__name))
        .attr('y', d => y(d.total_sales))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.total_sales))
        .attr('fill', '#4e73df');
};

// Quantity by Year chart
const createQuantityByYearChart = (data) => {
    const margin = {top: 20, right: 30, bottom: 50, left: 60};
    const width = document.getElementById('quantity-by-year-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#quantity-by-year-chart').html('');
    
    // Create SVG container
    const svg = d3.select('#quantity-by-year-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create x scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width])
        .padding(0.4);
    
    // Create y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_quantity)])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
            if (d >= 1000000) {
                return d3.format('.1f')(d / 1000000) + 'M';
            } else if (d >= 1000) {
                return d3.format('.1f')(d / 1000) + 'K';
            } else {
                return d3.format('.0f')(d);
            }
        }));
    
    // Create bars
    svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.year))
        .attr('y', d => y(d.total_quantity))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.total_quantity))
        .attr('fill', '#1cc88a');
};

// Profit by Category chart (horizontal bars)
const createProfitByCategoryChart = (data) => {
    // Tăng margin phải để đảm bảo đủ chỗ hiển thị các giá trị
    const margin = {top: 20, right: 90, bottom: 30, left: 120};
    const width = document.getElementById('profit-by-category-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#profit-by-category-chart').html('');
    
    // Sort data by profit (descending)
    data.sort((a, b) => b.total_profit - a.total_profit);
    
    // Create SVG container
    const svg = d3.select('#profit-by-category-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create y scale (categorical)
    const y = d3.scaleBand()
        .domain(data.map(d => d.product__subcategory__category__name))
        .range([0, height])
        .padding(0.3);
    
    // Cố định giá trị tối thiểu là -$200K thay vì dùng Math.max
    const minProfit = -200000;
    const maxProfit = d3.max(data, d => d.total_profit);
    
    // Create x scale (linear) that can handle negative values
    const x = d3.scaleLinear()
        .domain([minProfit, maxProfit])
        .nice()
        .range([0, width]);
    
    // Y axis (categories)
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // X axis (profit)
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => {
            if (d === 0) return "$0";
            else if (d < 0) return "-$" + Math.abs(d / 1000).toFixed(0) + "K";
            else return "$" + (d / 1000).toFixed(0) + "K";
        }));
    
    // Zero line
    svg.append('line')
        .attr('x1', x(0))
        .attr('y1', 0)
        .attr('x2', x(0))
        .attr('y2', height)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
    
    // Create bars
    svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', d => y(d.product__subcategory__category__name))
        .attr('x', d => d.total_profit < 0 ? x(0) : x(0))
        .attr('width', d => Math.abs(x(d.total_profit) - x(0)))
        .attr('height', y.bandwidth())
        .attr('fill', d => d.total_profit >= 0 ? '#f6c23e' : '#e74a3b')
        .attr('transform', d => d.total_profit < 0 ? `translate(${x(d.total_profit) - x(0)}, 0)` : '');
    
    // Add value labels with adjusted positioning
    svg.selectAll('text.value')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value')
        .attr('y', d => y(d.product__subcategory__category__name) + y.bandwidth() / 2)
        .attr('x', d => {
            // Đặt vị trí nhãn xa hơn từ đầu thanh để tránh bị cắt
            if (d.total_profit < 0) {
                return x(d.total_profit) - 10;
            } else {
                return x(d.total_profit) + 10;
            }
        })
        .attr('dy', '.35em')
        .attr('text-anchor', d => d.total_profit < 0 ? 'end' : 'start')
        .text(d => {
            if (Math.abs(d.total_profit) >= 1000000) {
                return '$' + (Math.abs(d.total_profit) / 1000000).toFixed(1) + 'M';
            } else if (Math.abs(d.total_profit) >= 1000) {
                return '$' + (Math.abs(d.total_profit) / 1000).toFixed(1) + 'K';
            } else {
                return '$' + Math.abs(d.total_profit).toFixed(0);
            }
        });
};

// Sales by Segment chart (pie chart with percentages)
const createSalesBySegmentChart = (data) => {
    const margin = {top: 20, right: 30, bottom: 40, left: 40};
    const width = document.getElementById('sales-by-segment-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#sales-by-segment-chart').html('');
    
    // Calculate total sales for percentage
    const totalSales = d3.sum(data, d => d.total_sales);
    
    // Create SVG container
    const svg = d3.select('#sales-by-segment-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);
    
    // Create pie generator
    const pie = d3.pie()
        .value(d => d.total_sales)
        .sort(null);
    
    // Create arc generator
    const radius = Math.min(width, height) / 2;
    const arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius * 0.8);
    
    // Create arc for labels
    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);
    
    // Create color scale - define explicit values since d3.schemeCategory10 is having issues
    const colorArray = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.order__customer__segment__name))
        .range(colorArray);
    
    // Create pie slices
    svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.order__customer__segment__name))
        .attr('stroke', 'white')
        .style('stroke-width', '2px');
    
    // Add labels with percentages
    const text = svg.selectAll('text')
        .data(pie(data))
        .enter()
        .append('text')
        .attr('transform', d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return `translate(${pos})`;
        })
        .attr('dy', '.35em')
        .style('text-anchor', d => {
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return midAngle < Math.PI ? 'start' : 'end';
        })
        .text(d => {
            // Calculate percentage
            const percentage = (d.data.total_sales / totalSales * 100).toFixed(1);
            return `${d.data.order__customer__segment__name}: ${percentage}%`;
        });
    
    // Add polylines
    svg.selectAll('polyline')
        .data(pie(data))
        .enter()
        .append('polyline')
        .attr('points', d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
        })
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', '1px');
    
};

// Order Quantity Distribution chart
const createOrderQuantityDistributionChart = (data) => {
    const margin = {top: 20, right: 30, bottom: 40, left: 60};
    const width = document.getElementById('order-quantity-distribution-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#order-quantity-distribution-chart').html('');
    
    // Create SVG container
    const svg = d3.select('#order-quantity-distribution-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create x scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.quantity))
        .range([0, width])
        .padding(0.1);
    
    // Create y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
            if (d >= 1000) {
                return d3.format('.0f')(d / 1000) + 'K';
            }
            return d3.format(',.0f')(d);
        }));
    
    // Create bars
    svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.quantity))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.count))
        .attr('fill', '#36b9cc');
};

// Handle filter changes
document.getElementById('year-filter').addEventListener('change', fetchData);
document.getElementById('quarter-filter').addEventListener('change', fetchData);
document.getElementById('month-filter').addEventListener('change', fetchData);

// Call fetchData when page is loaded
document.addEventListener('DOMContentLoaded', fetchData);