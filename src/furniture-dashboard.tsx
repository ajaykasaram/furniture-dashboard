import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

interface YearlyData {
  year: number;
  sales: number;
  profit: number;
  orders: number;
  avgOrderValue: number;
  salesGrowth: number;
  profitGrowth: number;
}

interface TotalMetrics {
  totalSales: number;
  totalProfit: number;
  totalOrders: number;
  avgOrderValue: number;
}

interface SubCategoryData {
  name: string;
  value: number;
  profit: number;
  orders: number;
}

const Dashboard = () => {
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [totalMetrics, setTotalMetrics] = useState<TotalMetrics>({
    totalSales: 0,
    totalProfit: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });
  const [subCategoryData, setSubCategoryData] = useState<SubCategoryData[]>([]);
  const [subCategoryTrends, setSubCategoryTrends] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // For production, we'll fetch the CSV from the public directory
        const response = await fetch('/FurnitureSales.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const csvText = await response.text();
        
        const parsedData = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        if (parsedData.errors.length > 0) {
          throw new Error('Error parsing CSV data');
        }

        const data = parsedData.data;

        // Process yearly data
        const yearlyStats = _.chain(data)
          .groupBy(row => new Date(row['Order Date']).getFullYear())
          .map((yearData, year) => ({
            year: parseInt(year),
            sales: _.sumBy(yearData, 'Sales'),
            profit: _.sumBy(yearData, 'Profit'),
            orders: yearData.length,
            avgOrderValue: _.sumBy(yearData, 'Sales') / yearData.length,
            salesGrowth: 0,
            profitGrowth: 0
          }))
          .value();

        // Calculate year-over-year growth
        yearlyStats.forEach((year, index) => {
          if (index > 0) {
            year.salesGrowth = ((year.sales - yearlyStats[index - 1].sales) / yearlyStats[index - 1].sales) * 100;
            year.profitGrowth = ((year.profit - yearlyStats[index - 1].profit) / yearlyStats[index - 1].profit) * 100;
          }
        });

        setYearlyData(yearlyStats);

        // Calculate total metrics
        setTotalMetrics({
          totalSales: _.sumBy(data, 'Sales'),
          totalProfit: _.sumBy(data, 'Profit'),
          totalOrders: data.length,
          avgOrderValue: _.sumBy(data, 'Sales') / data.length
        });

        // Process sub-category data
        const subCategoryStats = _.chain(data)
          .groupBy('Sub-Category')
          .map((subCatData, subCategory) => ({
            name: subCategory,
            value: _.sumBy(subCatData, 'Sales'),
            profit: _.sumBy(subCatData, 'Profit'),
            orders: subCatData.length,
          }))
          .orderBy(['value'], ['desc'])
          .value();

        setSubCategoryData(subCategoryStats);

        // Process sub-category trends
        const subCategoryTrendsData = _.chain(data)
          .groupBy(row => new Date(row['Order Date']).getFullYear())
          .map((yearData, year) => {
            const subCategories = _.groupBy(yearData, 'Sub-Category');
            return {
              year: parseInt(year),
              ..._.mapValues(subCategories, subCatData => _.sumBy(subCatData, 'Sales'))
            };
          })
          .value();

        setSubCategoryTrends(subCategoryTrendsData);
        setError(null);

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-red-600 font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-2xl font-bold mb-6">Furniture Sales Dashboard</div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalMetrics.totalSales)}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Profit</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalMetrics.totalProfit)}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-bold">{totalMetrics.totalOrders.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalMetrics.avgOrderValue)}</h3>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Percent className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Yearly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#2563eb" 
                    name="Sales"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sub-Category Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Sales by Sub-Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {subCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sub-Category Trends */}
        <Card className="bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle>Sub-Category Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subCategoryTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Chairs" stroke={COLORS[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="Tables" stroke={COLORS[1]} strokeWidth={2} />
                  <Line type="monotone" dataKey="Bookcases" stroke={COLORS[2]} strokeWidth={2} />
                  <Line type="monotone" dataKey="Furnishings" stroke={COLORS[3]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
