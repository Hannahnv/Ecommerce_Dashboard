// static/js/customer.js

// Fetch data from backend API
const fetchData = () => {
    // Get filter value
    const segmentId = document.getElementById('segment-filter').value;
    
    // Build URL with filter parameter
    let url = '/api/customer-data/';
    if (segmentId) {
        url += `?segment_id=${segmentId}`;
    }
    
    // Call API to get data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Update KPIs with corrected AOV calculation
            updateKPIs(data.kpi);
            
            // Create charts using D3.js
            createCustomersBySegmentChart(data.customers_by_segment);
            createPurchaseFrequencyChart(data.purchase_frequency);
            createTopCustomersTable(data.top_customers);
        })
        .catch(error => console.error('Error fetching data:', error));
};

// Format numbers for KPIs
const formatCurrency = (value) => {
    if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    } else {
        return '$' + value.toFixed(2);
    }
};

// Update KPIs with formatted values
const updateKPIs = (kpi) => {
    document.getElementById('total-customers').textContent = kpi.total_customers.toLocaleString();
    
    // Note: AOV calculation is now corrected in the backend to be:
    // total sales / count distinct Order ID
    document.getElementById('aov').textContent = formatCurrency(kpi.aov);
    document.getElementById('revenue-per-customer').textContent = formatCurrency(kpi.revenue_per_customer);
};

// Customers by Segment chart (horizontal bar chart)
const createCustomersBySegmentChart = (data) => {
    const margin = {top: 20, right: 120, bottom: 40, left: 150};
    const width = document.getElementById('customers-by-segment-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#customers-by-segment-chart').html('');
    
    // Sort data by customer count (descending)
    data.sort((a, b) => b.count - a.count);
    
    // Create SVG container
    const svg = d3.select('#customers-by-segment-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create y scale (categorical)
    const y = d3.scaleBand()
        .domain(data.map(d => d.segment__name))
        .range([0, height])
        .padding(0.3);
    
    // Create x scale (linear)
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) * 1.1]) // Add 10% for label space
        .nice()
        .range([0, width]);
    
    // Create color scale
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.segment__name))
        .range(d3.schemeCategory10);
    
    // Y axis (segment names)
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // X axis (customer count)
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => {
            if (d >= 1000) {
                return d3.format('.0f')(d / 1000) + 'K';
            }
            return d3.format(',.0f')(d);
        }));
    
    // Create bars with different colors
    svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', d => y(d.segment__name))
        .attr('x', 0)
        .attr('width', d => x(d.count))
        .attr('height', y.bandwidth())
        .attr('fill', d => color(d.segment__name));
    
    // Add count labels at end of bars
    svg.selectAll('.count-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'count-label')
        .attr('y', d => y(d.segment__name) + y.bandwidth() / 2)
        .attr('x', d => x(d.count) + 5)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .text(d => d.count.toLocaleString());
};

// Purchase Frequency chart
// Purchase Frequency chart - fixed to match the histogram style 
const createPurchaseFrequencyChart = (data) => {
    const margin = {top: 40, right: 30, bottom: 50, left: 60};
    const width = document.getElementById('purchase-frequency-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#purchase-frequency-chart').html('');
    
    // Sort data by order count
    data.sort((a, b) => a.order_count - b.order_count);
    
    // Create SVG container with white background
    const svg = d3.select('#purchase-frequency-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add white background
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white');
    
    // Create x scale - use band scale for discrete values
    const x = d3.scaleBand()
        .domain(data.map(d => d.order_count))
        .range([0, width])
        .padding(0.1);
    
    // Create y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.customer_count) * 1.05]) // Add 5% padding at top
        .nice()
        .range([height, 0]);
    
    // Add gridlines for y axis only
    svg.append('g')
        .attr('class', 'grid')
        .selectAll('line.grid-line')
        .data(y.ticks(10))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .attr('stroke', '#ddd')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => d)
        )
        .selectAll('path, line')
        .attr('stroke', '#000')
        .style('shape-rendering', 'crispEdges');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y)
            .tickFormat(d => {
                if (d >= 1000) {
                    return d3.format(',.0f')(d);
                }
                return d3.format(',.0f')(d);
            })
        )
        .selectAll('path, line')
        .attr('stroke', '#000')
        .style('shape-rendering', 'crispEdges');
    
    // Remove axis lines
    svg.selectAll('.domain').remove();
    
    // Create bars (histogram style) with skyblue color
    svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.order_count))
        .attr('y', d => y(d.customer_count))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.customer_count))
        .attr('fill', 'steelblue');
    
    // Add chart title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Purchase Frequency Distribution');
    
    // Add x-axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text('Total Customers');
    
    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text('Purchase Frequency');
};

// Top Customers table
const createTopCustomersTable = (data) => {
    const container = d3.select('#top-customers-table');
    container.html('');
    
    // Create table
    const table = container.append('table')
        .attr('class', 'table table-striped table-sm');
    
    // Create table header
    const thead = table.append('thead');
    thead.append('tr')
        .selectAll('th')
        .data(['Customer ID', 'Sales', 'Profit'])
        .enter()
        .append('th')
        .text(d => d);
    
    // Create table body
    const tbody = table.append('tbody');
    
    // Sort customers by sales in descending order
    data.sort((a, b) => b.total_sales - a.total_sales);
    
    // Add rows to table
    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');
    
    // Add cells for each row
    rows.append('td')
        .text(d => d.order__customer__customer_id);
    
    rows.append('td')
        .text(d => '$' + d.total_sales.toLocaleString(undefined, {maximumFractionDigits: 0}));
    
    rows.append('td')
        .text(d => '$' + Number(d.total_profit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    
    rows.append('td')
        .text(d => d.profit_margin.toFixed(2) + '%');
};

// Handle filter change
document.getElementById('segment-filter').addEventListener('change', fetchData);

// Call fetchData when page is loaded
document.addEventListener('DOMContentLoaded', fetchData);