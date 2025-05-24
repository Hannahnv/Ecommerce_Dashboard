# dashboard/utils.py

import pandas as pd
from django.db import transaction
from .models import (
    Region, Market, Country, State, City,
    CustomerSegment, Customer, Category, 
    Subcategory, Product, Order, OrderDetail
)

def import_excel_data(excel_file):
    """Nhập dữ liệu từ file Excel vào cơ sở dữ liệu"""
    try:
        # Đọc file Excel
        df = pd.read_excel(excel_file)
        
        # Xử lý dữ liệu thiếu
        df = df.fillna('')
        
        # Sử dụng transaction để đảm bảo tính nhất quán
        with transaction.atomic():
            # 1. Xử lý Region và Market
            regions = {}
            markets = {}
            
            for _, row in df.drop_duplicates(['Region', 'Market']).iterrows():
                region_name = row['Region']
                market_name = row['Market']
                
                # Tạo hoặc lấy đối tượng Region
                if region_name not in regions:
                    region, created = Region.objects.get_or_create(name=region_name)
                    regions[region_name] = region
                
                # Tạo hoặc lấy đối tượng Market
                if market_name not in markets:
                    market, created = Market.objects.get_or_create(
                        name=market_name,
                        region=regions[region_name]
                    )
                    markets[market_name] = market
            
            # 2. Xử lý Country, State, City
            countries = {}
            states = {}
            cities = {}
            
            for _, row in df.drop_duplicates(['Country', 'State', 'City']).iterrows():
                country_name = row['Country']
                state_name = row['State']
                city_name = row['City']
                market_name = row['Market']
                
                # Lấy giá trị vĩ độ và kinh độ
                latitude = row['Country latitude'] if 'Country latitude' in row and row['Country latitude'] else None
                longitude = row['Country longitude'] if 'Country longitude' in row and row['Country longitude'] else None
                
                # Tạo hoặc lấy đối tượng Country
                country_key = country_name
                if country_key not in countries:
                    country, created = Country.objects.get_or_create(
                        name=country_name,
                        defaults={
                            'market': markets[market_name],
                            'latitude': latitude,
                            'longitude': longitude
                        }
                    )
                    countries[country_key] = country
                
                # Tạo hoặc lấy đối tượng State
                state_key = f"{country_name}_{state_name}"
                if state_key not in states and state_name:
                    state, created = State.objects.get_or_create(
                        name=state_name,
                        country=countries[country_key]
                    )
                    states[state_key] = state
                
                # Tạo hoặc lấy đối tượng City
                city_key = f"{country_name}_{state_name}_{city_name}"
                if city_key not in cities and city_name and state_name:
                    city, created = City.objects.get_or_create(
                        name=city_name,
                        state=states[state_key]
                    )
                    cities[city_key] = city
            
            # 3. Xử lý phân khúc khách hàng và khách hàng
            segments = {}
            customers = {}
            
            for _, row in df.drop_duplicates(['Customer ID', 'Segment']).iterrows():
                segment_name = row['Segment']
                customer_id = row['Customer ID']
                
                # Tạo hoặc lấy đối tượng CustomerSegment
                if segment_name not in segments:
                    segment, created = CustomerSegment.objects.get_or_create(name=segment_name)
                    segments[segment_name] = segment
                
                # Tạo hoặc lấy đối tượng Customer
                if customer_id not in customers:
                    customer, created = Customer.objects.get_or_create(
                        customer_id=customer_id,
                        defaults={
                            'segment': segments[segment_name]
                        }
                    )
                    customers[customer_id] = customer
            
            # 4. Xử lý danh mục, danh mục con và sản phẩm
            categories = {}
            subcategories = {}
            products = {}
            
            for _, row in df.drop_duplicates(['Category', 'Subcategory', 'Product']).iterrows():
                category_name = row['Category']
                subcategory_name = row['Subcategory']
                product_name = row['Product']
                
                # Tạo hoặc lấy đối tượng Category
                if category_name not in categories:
                    category, created = Category.objects.get_or_create(name=category_name)
                    categories[category_name] = category
                
                # Tạo hoặc lấy đối tượng Subcategory
                subcategory_key = f"{category_name}_{subcategory_name}"
                if subcategory_key not in subcategories:
                    subcategory, created = Subcategory.objects.get_or_create(
                        name=subcategory_name,
                        category=categories[category_name]
                    )
                    subcategories[subcategory_key] = subcategory
                
                # Tạo hoặc lấy đối tượng Product
                product_key = f"{category_name}_{subcategory_name}_{product_name}"
                if product_key not in products:
                    product, created = Product.objects.get_or_create(
                        name=product_name,
                        subcategory=subcategories[subcategory_key]
                    )
                    products[product_key] = product
            
            # 5. Xử lý đơn hàng và chi tiết đơn hàng
            orders = {}
            
            for _, row in df.iterrows():
                row_id = row['Row ID']
                order_id = row['Order ID']
                order_date = pd.to_datetime(row['Order Date']).date()
                customer_id = row['Customer ID']
                city_name = row['City']
                state_name = row['State']
                country_name = row['Country']
                product_name = row['Product']
                subcategory_name = row['Subcategory']
                category_name = row['Category']
                
                # Tạo keys
                city_key = f"{country_name}_{state_name}_{city_name}"
                product_key = f"{category_name}_{subcategory_name}_{product_name}"
                
                # Lấy city và product
                city = cities.get(city_key)
                product = products.get(product_key)
                
                # Nếu không tìm thấy city hoặc product, bỏ qua record này
                if not city or not product:
                    continue
                
                # Tạo hoặc lấy đối tượng Order
                if order_id not in orders:
                    order, created = Order.objects.get_or_create(
                        order_id=order_id,
                        defaults={
                            'order_date': order_date,
                            'customer': customers[customer_id],
                            'city': city
                        }
                    )
                    orders[order_id] = order
                
                # Tạo đối tượng OrderDetail
                OrderDetail.objects.create(
                    row_id=row_id,
                    order=orders[order_id],
                    product=product,
                    quantity=int(row['Quantity']),
                    sales=float(row['Sales']),
                    discount=float(row['Discount']),
                    profit=float(row['Profit'])
                )
                
        return True, "Dữ liệu đã được nhập thành công!"
    except Exception as e:
        return False, f"Lỗi khi nhập dữ liệu: {str(e)}"