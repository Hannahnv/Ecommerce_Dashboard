// static/js/market.js

// Fetch data from backend API
const fetchData = () => {
    // Get filter value
    const marketId = document.getElementById('market-filter').value;
    
    // Build URL with filter parameter
    let url = '/api/market-data/';
    if (marketId) {
        url += `?market_id=${marketId}`;
    }
    
    // Call API to get data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Create charts using D3.js
            createSalesByMarketChart(data.sales_by_market);
            createProfitByRegionMarketWorldMap(data.profit_by_region_market);
            createTopProductsByMarketTable(data.top_products_by_market);
        })
        .catch(error => console.error('Error fetching data:', error));
};

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

// Improved World Map for Profit by Region and Market
// Improved World Map for Profit by Region and Market
const createProfitByRegionMarketWorldMap = (data) => {
    // Define container dimensions - make sure this matches the actual card dimensions
    const containerWidth = document.getElementById('profit-by-region-market-chart').clientWidth;
    const containerHeight = 400; // Adjust this based on your actual card height
    
    // Define margins to keep the map fully within the visible area
    const margin = {top: 10, right: 120, bottom: 10, left: 10};
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#profit-by-region-market-chart').html('');
    
    // Create SVG container with exact dimensions
    const svg = d3.select('#profit-by-region-market-chart')
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Define market coordinates (approximate for visualization)
    const marketCoordinates = {
        // Format: [longitude, latitude]
        'Africa': [20, 5],
        'APAC': [100, 10],
        'EU': [10, 50],
        'EMEA': [20, 40],
        'LATAM': [-70, 0],
        'US': [-100, 40],
        'USCA': [-90, 35],
        
        // Countries coordinates
        'Australia': [135, -25],
        'Brazil': [-55, -10],
        'Canada': [-100, 60],
        'China': [105, 35],
        'France': [2, 46],
        'Germany': [10, 51],
        'India': [80, 20],
        'Indonesia': [120, 0],
        'Italy': [12, 42],
        'Japan': [140, 35],
        'Mexico': [-102, 23],
        'Netherlands': [5, 52],
        'New Zealand': [170, -40],
        'Saudi Arabia': [45, 25],
        'South Africa': [25, -30],
        'South Korea': [127, 37],
        'Spain': [-3, 40],
        'Sweden': [15, 60],
        'UK': [-3, 55],
        'United Kingdom': [-3, 55],
        'United States': [-100, 40]
    };
    
    // Add jitter to prevent exactly overlapping points
    const addJitter = (coord, amount = 5) => {
        return [
            coord[0] + (Math.random() - 0.5) * amount,
            coord[1] + (Math.random() - 0.5) * amount
        ];
    };
    
    // Process market data with coordinates
    const marketData = [];
    
    // Group by region
    const regionGroups = d3.groups(data, d => d.order__city__state__country__market__region__name);
    
    // Process each region and its markets
    regionGroups.forEach(regionGroup => {
        const regionName = regionGroup[0];
        const markets = regionGroup[1];
        
        markets.forEach(market => {
            const marketName = market.order__city__state__country__market__name;
            let coordinates;
            
            // Try to find coordinates for this market
            if (marketCoordinates[marketName]) {
                coordinates = addJitter(marketCoordinates[marketName], 5);
            } else if (marketCoordinates[regionName]) {
                // Use region coordinates with more jitter if market coordinates not found
                coordinates = addJitter(marketCoordinates[regionName], 15);
            } else {
                // Default coordinates if neither found
                coordinates = [0, 0];
            }
            
            marketData.push({
                region: regionName,
                market: marketName,
                profit: market.total_profit,
                longitude: coordinates[0],
                latitude: coordinates[1]
            });
        });
    });
    
    // Add a border to visualize the chart area
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('ry', 4);
    
    // Set up the map projection with careful scaling to fit within the container
    const projection = d3.geoNaturalEarth1() // Use a projection that maintains proportions
        .scale(width / 6.0) // Adjust this value to fit the map properly
        .translate([width / 2, height / 2]); // Center the map
    
    // Create path generator
    const path = d3.geoPath().projection(projection);
    
    // Create a clipping path to ensure the map stays within bounds
    svg.append("defs")
        .append("clipPath")
        .attr("id", "map-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
    
    // Create a group for the map content with clipping applied
    const mapGroup = svg.append("g")
        .attr("clip-path", "url(#map-clip)");
    
    // Load world map data
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .then(worldData => {
            // Draw base world map
            mapGroup.selectAll('path.country')
                .data(worldData.features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('fill', '#f5f5f5')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 0.5);
            
            // Create color scale for regions
            const colorScale = d3.scaleOrdinal()
                .domain(regionGroups.map(d => d[0]))
                .range(d3.schemeCategory10);
            
            // Calculate profit range for bubble sizing
            const minProfit = d3.min(marketData, d => Math.abs(d.profit));
            const maxProfit = d3.max(marketData, d => Math.abs(d.profit));
            
            // Create radius scale for bubbles, adjust max size to avoid too large bubbles
            const radiusScale = d3.scaleSqrt()
                .domain([minProfit, maxProfit])
                .range([3, 12]); // Smaller bubbles to ensure they fit
            
            // Add market bubbles
            mapGroup.selectAll('.market-bubble')
                .data(marketData)
                .enter()
                .append('circle')
                .attr('class', 'market-bubble')
                .attr('cx', d => {
                    const coords = projection([d.longitude, d.latitude]);
                    return coords ? coords[0] : 0;
                })
                .attr('cy', d => {
                    const coords = projection([d.longitude, d.latitude]);
                    return coords ? coords[1] : 0;
                })
                .attr('r', d => radiusScale(Math.abs(d.profit)))
                .attr('fill', d => colorScale(d.region))
                .attr('stroke', 'white')
                .attr('stroke-width', 0.5)
                .attr('opacity', 0.8)
                .append('title')
                .text(d => `${d.market} (${d.region}): $${d.profit.toLocaleString()}`);
            
            // Add legend for regions - positioned outside the map area
            const legend = svg.append('g')
                .attr('transform', `translate(${width + 10}, 10)`);
            
            // Add legend title
            legend.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .text('Regions');
            
            // Add color squares for regions
            legend.selectAll('.region-square')
                .data(regionGroups)
                .enter()
                .append('rect')
                .attr('class', 'region-square')
                .attr('x', 0)
                .attr('y', (d, i) => i * 18 + 10)
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', d => colorScale(d[0]));
            
            // Add region labels
            legend.selectAll('.region-label')
                .data(regionGroups)
                .enter()
                .append('text')
                .attr('class', 'region-label')
                .attr('x', 18)
                .attr('y', (d, i) => i * 18 + 10 + 9)
                .style('font-size', '10px')
                .text(d => d[0]);
            
            // Add legend for bubble sizes
            const sizeLegend = svg.append('g')
                .attr('transform', `translate(${width + 10}, ${regionGroups.length * 18 + 30})`);
            
            // Add size legend title
            sizeLegend.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .text('Profit');
            
            // Add size reference values
            const sizeValues = [
                minProfit, 
                minProfit + (maxProfit - minProfit) / 2, 
                maxProfit
            ];
            
            // Add circles for size reference
            sizeLegend.selectAll('.size-circle')
                .data(sizeValues)
                .enter()
                .append('circle')
                .attr('class', 'size-circle')
                .attr('cx', 6)
                .attr('cy', (d, i) => i * 18 + 20)
                .attr('r', d => radiusScale(d))
                .attr('fill', 'none')
                .attr('stroke', '#666')
                .attr('stroke-width', 1);
            
            // Add size labels
            sizeLegend.selectAll('.size-label')
                .data(sizeValues)
                .enter()
                .append('text')
                .attr('class', 'size-label')
                .attr('x', 18)
                .attr('y', (d, i) => i * 18 + 20 + 4)
                .style('font-size', '10px')
                .text(d => {
                    if (d >= 1000000) {
                        return '$' + (d / 1000000).toFixed(1) + 'M';
                    } else if (d >= 1000) {
                        return '$' + (d / 1000).toFixed(0) + 'K';
                    } else {
                        return '$' + d.toFixed(0);
                    }
                });
        })
        .catch(error => {
            console.error('Error loading world map:', error);
            // Fallback to bar chart if map loading fails
            createProfitByRegionMarketBarChart(data);
        });
};

// Fallback bar chart if map fails to load
const createProfitByRegionMarketBarChart = (data) => {
    const margin = {top: 20, right: 30, bottom: 90, left: 60};
    const width = document.getElementById('profit-by-region-market-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart if exists
    d3.select('#profit-by-region-market-chart').html('');
    
    // Group data by region
    const nestedData = d3.groups(data, d => d.order__city__state__country__market__region__name);
    
    // Create SVG container
    const svg = d3.select('#profit-by-region-market-chart')
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
        .domain([0, d3.max(data, d => d.total_profit)])
        .nice()
        .range([height, 0]);
    
    // Create color scale by region
    const color = d3.scaleOrdinal()
        .domain(nestedData.map(d => d[0]))
        .range(d3.schemeCategory10);
    
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
        .attr('y', d => y(d.total_profit))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.total_profit))
        .attr('fill', d => color(d.order__city__state__country__market__region__name));
    
    // Add legend
    const legend = svg.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .attr('text-anchor', 'end')
        .selectAll('g')
        .data(nestedData)
        .enter().append('g')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);
    
    legend.append('rect')
        .attr('x', width - 19)
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', d => color(d[0]));
    
    legend.append('text')
        .attr('x', width - 24)
        .attr('y', 9.5)
        .attr('dy', '0.32em')
        .text(d => d[0]);
};

// Create top products by market table with improved formatting
const createTopProductsByMarketTable = (data) => {
    const container = d3.select('#top-products-by-market');
    container.html('');
    
    // Create a better structured table with all markets and products
    const table = container.append('table')
        .attr('class', 'table table-striped table-sm table-bordered');
    
    // Create table header
    const thead = table.append('thead')
        .attr('class', 'thead-dark');
    
    thead.append('tr')
        .selectAll('th')
        .data(['Market', 'Product', 'Total Sales'])
        .enter()
        .append('th')
        .text(d => d);
    
    // Create table body
    const tbody = table.append('tbody');
    
    // Process data for table rows
    const tableData = [];
    Object.entries(data).forEach(([marketName, products]) => {
        // For each market, take top 5 products
        products.forEach((product, index) => {
            if (index < 5) { // Limit to top 5 products per market
                tableData.push({
                    market: marketName,
                    product: product.product__name,
                    sales: product.total_sales
                });
            }
        });
    });
    
    // Group by market for display
    const marketGroups = d3.groups(tableData, d => d.market);
    
    // Add each market's products to the table
    marketGroups.forEach(marketGroup => {
        const marketName = marketGroup[0];
        const products = marketGroup[1];
        
        // Add market header row
        tbody.append('tr')
            .attr('class', 'table-primary')
            .append('td')
            .attr('colspan', 3)
            .style('font-weight', 'bold')
            .text(marketName);
        
        // Add product rows for this market
        products.forEach(product => {
            const row = tbody.append('tr');
            
            // Empty market column (for alignment)
            row.append('td')
                .style('border-top', 'none')
                .style('border-bottom', 'none')
                .text('');
            
            // Product name
            row.append('td')
                .text(product.product);
            
            // Sales value
            row.append('td')
                .text(() => {
                    if (product.sales >= 1000000) {
                        return '$' + (product.sales / 1000000).toFixed(1) + 'M';
                    } else if (product.sales >= 1000) {
                        return '$' + (product.sales / 1000).toFixed(1) + 'K';
                    } else {
                        return '$' + product.sales.toFixed(0);
                    }
                });
        });
    });
};

// Handle filter change
document.getElementById('market-filter').addEventListener('change', fetchData);

// Call fetchData when page is loaded
document.addEventListener('DOMContentLoaded', fetchData);