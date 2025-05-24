# dashboard/urls.py

from django.urls import path
from . import views

# Cần đặt biến urlpatterns là một danh sách các đường dẫn URL
urlpatterns = [
    # URLs cho các trang chính
    path('', views.overview, name='overview'),
    path('market/', views.market, name='market'),
    path('customer/', views.customer, name='customer'),
    path('product/', views.product, name='product'),
    path('import-excel/', views.import_excel, name='import_excel'),  # Đổi từ import-csv thành import-excel
    
    # API endpoints để lấy dữ liệu cho các biểu đồ
    path('api/overview-data/', views.overview_data, name='overview_data'),
    path('api/market-data/', views.market_data, name='market_data'),
    path('api/customer-data/', views.customer_data, name='customer_data'),
    path('api/product-data/', views.product_data, name='product_data'),
]