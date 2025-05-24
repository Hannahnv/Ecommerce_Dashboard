from django.shortcuts import render

# Create your views here.
# dashboard/views.py

import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import ExtractYear, ExtractMonth, ExtractWeekDay
from .models import (
    Region, Market, Country, State, City,
    CustomerSegment, Customer, Category, 
    Subcategory, Product, Order, OrderDetail
)
from .utils import import_excel_data

def overview(request):
    """Hiển thị trang tổng quan"""
    # Lấy danh sách năm để hiển thị trong bộ lọc
    years = OrderDetail.objects.annotate(year=ExtractYear('order__order_date'))\
        .values('year').distinct().order_by('year')
    
    context = {
        'years': years,
        'title': 'Tổng quan'
    }
    return render(request, 'dashboard/overview.html', context)

def market(request):
    """Hiển thị trang phân tích thị trường"""
    # Lấy danh sách các thị trường để hiển thị trong bộ lọc
    markets = Market.objects.all().order_by('name')
    
    context = {
        'markets': markets,
        'title': 'Phân tích thị trường'
    }
    return render(request, 'dashboard/market.html', context)

def customer(request):
    """Hiển thị trang phân tích khách hàng"""
    # Lấy danh sách các phân khúc khách hàng để hiển thị trong bộ lọc
    segments = CustomerSegment.objects.all().order_by('name')
    
    context = {
        'segments': segments,
        'title': 'Phân tích khách hàng'
    }
    return render(request, 'dashboard/customer.html', context)

def product(request):
    """Hiển thị trang phân tích sản phẩm"""
    # Lấy danh sách các danh mục và danh mục con để hiển thị trong bộ lọc
    categories = Category.objects.all().order_by('name')
    subcategories = Subcategory.objects.all().order_by('name')
    
    context = {
        'categories': categories,
        'subcategories': subcategories,
        'title': 'Phân tích sản phẩm'
    }
    return render(request, 'dashboard/product.html', context)

def import_excel(request):
    """Xử lý nhập dữ liệu từ file Excel"""
    if request.method == 'POST' and request.FILES.get('excel_file'):
        excel_file = request.FILES['excel_file']
        success, message = import_excel_data(excel_file)
        if success:
            return redirect('overview')
        else:
            # Xử lý lỗi
            return render(request, 'dashboard/import.html', {'error': message})
    else:
        return render(request, 'dashboard/import.html', {'title': 'Nhập dữ liệu'})

def overview_data(request):
    """API endpoint cho dữ liệu tổng quan"""
    # KPIs tổng hợp
    total_sales = OrderDetail.objects.aggregate(total=Sum('sales'))['total'] or 0
    total_profit = OrderDetail.objects.aggregate(total=Sum('profit'))['total'] or 0
    total_quantity = OrderDetail.objects.aggregate(total=Sum('quantity'))['total'] or 0
    
    # Các tham số lọc
    year = request.GET.get('year')
    month = request.GET.get('month')
    quarter = request.GET.get('quarter')
    
    # Áp dụng bộ lọc nếu có
    queryset = OrderDetail.objects.all()
    if year:
        queryset = queryset.filter(order__order_date__year=year)
    if month:
        queryset = queryset.filter(order__order_date__month=month)
    if quarter:
        months = []
        if quarter == '1':
            months = [1, 2, 3]
        elif quarter == '2':
            months = [4, 5, 6]
        elif quarter == '3':
            months = [7, 8, 9]
        elif quarter == '4':
            months = [10, 11, 12]
        queryset = queryset.filter(order__order_date__month__in=months)
    
    # Doanh số theo thị trường
    sales_by_market = list(queryset.values('order__city__state__country__market__name')
                          .annotate(total_sales=Sum('sales'))
                          .order_by('-total_sales'))
    
    # Số lượng theo năm
    quantity_by_year = list(queryset.annotate(year=ExtractYear('order__order_date'))
                           .values('year')
                           .annotate(total_quantity=Sum('quantity'))
                           .order_by('year'))
    
    # Lợi nhuận theo danh mục
    profit_by_category = list(queryset.values('product__subcategory__category__name')
                             .annotate(total_profit=Sum('profit'))
                             .order_by('-total_profit'))
    
    # Doanh số theo phân khúc khách hàng
    sales_by_segment = list(queryset.values('order__customer__segment__name')
                           .annotate(total_sales=Sum('sales'))
                           .order_by('-total_sales'))
    
    # Phân phối số lượng đơn hàng
    order_quantity_distribution = list(queryset.values('quantity')
                                     .annotate(count=Count('id'))
                                     .order_by('quantity'))
    
    data = {
        'kpi': {
            'total_sales': float(total_sales),
            'total_profit': float(total_profit),
            'total_quantity': total_quantity
        },
        'sales_by_market': sales_by_market,
        'quantity_by_year': quantity_by_year,
        'profit_by_category': profit_by_category,
        'sales_by_segment': sales_by_segment,
        'order_quantity_distribution': order_quantity_distribution
    }
    
    return JsonResponse(data)

def market_data(request):
    """API endpoint cho dữ liệu thị trường"""
    # Tham số lọc
    market_id = request.GET.get('market_id')
    
    # Base queryset
    queryset = OrderDetail.objects.all()
    
    # Áp dụng bộ lọc nếu có
    if market_id:
        queryset = queryset.filter(order__city__state__country__market_id=market_id)
    
    # Doanh số theo thị trường
    sales_by_market = list(queryset.values('order__city__state__country__market__name')
                          .annotate(total_sales=Sum('sales'))
                          .order_by('-total_sales'))
    
    # Top 5 sản phẩm bán chạy nhất ở mỗi thị trường
    markets = Market.objects.all()
    top_products_by_market = {}
    
    for market in markets:
        top_products = list(queryset.filter(order__city__state__country__market=market)
                          .values('product__name')
                          .annotate(total_sales=Sum('sales'))
                          .order_by('-total_sales')[:5])
        top_products_by_market[market.name] = top_products
    
    # Lợi nhuận theo vùng và thị trường
    profit_by_region_market = list(queryset.values(
                                 'order__city__state__country__market__region__name', 
                                 'order__city__state__country__market__name')
                                .annotate(total_profit=Sum('profit'))
                                .order_by('order__city__state__country__market__region__name', '-total_profit'))
    
    data = {
        'sales_by_market': sales_by_market,
        'top_products_by_market': top_products_by_market,
        'profit_by_region_market': profit_by_region_market
    }
    
    return JsonResponse(data)

def customer_data(request):
    """API endpoint cho dữ liệu khách hàng"""
    # Tham số lọc
    segment_id = request.GET.get('segment_id')
    
    # Base queryset
    queryset = OrderDetail.objects.all()
    
    # Áp dụng bộ lọc nếu có
    if segment_id:
        queryset = queryset.filter(order__customer__segment_id=segment_id)
    
    # Tổng số khách hàng
    total_customers = Customer.objects.count()
    if segment_id:
        total_customers = Customer.objects.filter(segment_id=segment_id).count()
    
    # Giá trị đơn hàng trung bình
    # Giá trị đơn hàng trung bình (AOV) - công thức mới
    aov = queryset.values('order__order_id') \
        .annotate(order_total=Sum('sales')) \
        .aggregate(avg=Avg('order_total'))['avg'] or 0    
        
    # Doanh thu trung bình mỗi khách hàng
    revenue_per_customer = queryset.values('order__customer') \
        .annotate(total_revenue=Sum('sales')) \
        .aggregate(avg_revenue=Avg('total_revenue'))['avg_revenue'] or 0
    
    # Khách hàng theo phân khúc
    customers_by_segment = list(Customer.objects.values('segment__name')
                               .annotate(count=Count('id'))
                               .order_by('-count'))
    
    # Phân phối tần suất mua hàng
    orders_per_customer = queryset.values('order__customer__customer_id') \
        .annotate(order_count=Count('order__order_id', distinct=True)) \
        .values_list('order_count', flat=True)
    
    # Tạo histogram từ dữ liệu
    purchase_frequency_counts = {}
    for count in orders_per_customer:
        if count not in purchase_frequency_counts:
            purchase_frequency_counts[count] = 0
        purchase_frequency_counts[count] += 1
    
    # Chuyển đổi sang định dạng list cho API
    purchase_frequency = [
        {"order_count": order_count, "customer_count": count} 
        for order_count, count in purchase_frequency_counts.items()
    ]
    
    # Sắp xếp theo số lượng đơn hàng
    purchase_frequency.sort(key=lambda x: x["order_count"])
    
    # Top 10 khách hàng theo doanh số
    top_customers = list(queryset.values('order__customer__customer_id')
                        .annotate(
                            total_sales=Sum('sales'),
                            total_profit=Sum('profit'),
                            profit_margin=Sum('profit') * 100 / Sum('sales')
                        )
                        .order_by('-total_sales')[:10])
    
    data = {
        'kpi': {
            'total_customers': total_customers,
            'aov': float(aov),
            'revenue_per_customer': float(revenue_per_customer)
        },
        'customers_by_segment': customers_by_segment,
        'purchase_frequency': purchase_frequency,
        'top_customers': top_customers
    }
    
    return JsonResponse(data)

def product_data(request):
    """API endpoint cho dữ liệu sản phẩm"""
    # Các tham số lọc
    category_id = request.GET.get('category_id')
    subcategory_id = request.GET.get('subcategory_id')
    product_id = request.GET.get('product_id')
    
    # Base queryset
    queryset = OrderDetail.objects.all()
    
    # Áp dụng bộ lọc nếu có
    if category_id:
        queryset = queryset.filter(product__subcategory__category_id=category_id)
    if subcategory_id:
        queryset = queryset.filter(product__subcategory_id=subcategory_id)
    if product_id:
        queryset = queryset.filter(product_id=product_id)
    
    # Doanh số, lợi nhuận và % tỷ lệ lợi nhuận theo danh mục, danh mục con, sản phẩm
    product_metrics = list(queryset.values(
            'product__subcategory__category__name', 
            'product__subcategory__name', 
            'product__name'
        )
        .annotate(
            total_sales=Sum('sales'),
            total_profit=Sum('profit'),
            profit_margin=Sum('profit') * 100 / Sum('sales')
        )
        .order_by('-total_sales'))
    
    # Giảm giá trung bình và tỷ lệ lợi nhuận theo danh mục sản phẩm
    category_metrics = list(queryset.values('product__subcategory__category__name')
                          .annotate(
                              avg_discount=Avg('discount') * 100,
                              avg_profit_margin=Sum('profit') * 100 / Sum('sales')
                          )
                          .order_by('product__subcategory__category__name'))
    
    # Doanh số cao điểm theo tháng
    peak_sales_by_month = list(queryset.annotate(month=ExtractMonth('order__order_date'))
                              .values('month')
                              .annotate(total_sales=Sum('sales'))
                              .order_by('-total_sales'))
    
    # Doanh số cao điểm theo ngày trong tuần
    peak_sales_by_day = list(queryset.annotate(day=ExtractWeekDay('order__order_date'))
                            .values('day')
                            .annotate(total_sales=Sum('sales'))
                            .order_by('-total_sales'))
    # Doanh số theo tháng và ngày trong tuần (cho heatmap)
    sales_by_month_day = list(queryset.annotate(
            month=ExtractMonth('order__order_date'),
            day=ExtractWeekDay('order__order_date')
        ).values('month', 'day')
        .annotate(total_sales=Sum('sales'))
        .order_by('month', 'day'))
    
    data = {
        'product_metrics': product_metrics,
        'category_metrics': category_metrics,
        'peak_sales_by_month': peak_sales_by_month,
        'peak_sales_by_day': peak_sales_by_day,
        'sales_by_month_day': sales_by_month_day  
        }
    
    return JsonResponse(data)