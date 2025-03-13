# Recharts & Data Visualization

## Overview
Recharts is a composable charting library built on React components, perfect for visualizing fitness and nutrition data.

## Features Used in Our Fitness App
- **Line Charts**: Tracking progress over time (weight, strength, cardio performance)
- **Bar Charts**: Comparing workout volume across different exercises or time periods
- **Area Charts**: Visualizing calorie/macro intake patterns
- **Pie/Donut Charts**: Breaking down macronutrient percentages
- **Scatter Plots**: Analyzing relationships between metrics (e.g., calories vs. weight)
- **Responsive Design**: Adapting charts to different screen sizes

## Implementation Examples

### Weight Tracking Line Chart
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function WeightTrackingChart({ weightData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={weightData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={['auto', 'auto']} />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke="#8884d8" 
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Macronutrient Breakdown
```tsx
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

function MacroBreakdownChart({ macros }) {
  const data = [
    { name: 'Protein', value: macros.protein, color: '#0088FE' },
    { name: 'Carbs', value: macros.carbs, color: '#00C49F' },
    { name: 'Fat', value: macros.fat, color: '#FFBB28' }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Workout Volume Tracking
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ExerciseVolumeChart({ volumeData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={volumeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="bench" name="Bench Press" fill="#8884d8" />
        <Bar dataKey="squat" name="Squat" fill="#82ca9d" />
        <Bar dataKey="deadlift" name="Deadlift" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## Data Processing Examples
- Converting raw API data to chart-ready format
- Aggregating daily data into weekly summaries
- Calculating moving averages for trend visualization