"use client"

import React from 'react'

export function SalesAnalyticsCard() {
  return (
    <div className="w-80 bg-white rounded-xl shadow-lg p-6 relative">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Real-Time Performance</h2>
      <p className="text-gray-500 text-sm mb-6">
        Track your sales team's success with live metrics and proven results.
      </p>
      
      <div className="relative">
        {/* Background card (slightly blurred/faded) */}
        <div className="absolute left-4 top-4 w-64 h-20 bg-gray-100 rounded-xl opacity-60 z-0"></div>
        
        {/* Foreground card with sales rep data */}
        <div className="relative flex items-center w-64 h-20 bg-white rounded-xl shadow-md z-10 p-4">
          {/* Sales rep headshot with progress ring */}
          <div className="relative mr-4">
            {/* Progress ring background (full circle) */}
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#e5e7eb"
                strokeWidth="2"
                fill="none"
              />
              {/* Progress ring (85% completion) */}
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${85 * 0.628} 62.8`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Headshot */}
            <div className="absolute top-1 left-1 w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-semibold flex items-center justify-center">
                MJ
              </div>
            </div>
          </div>
          
          {/* Metrics */}
          <div>
            <div className="text-lg font-semibold text-gray-800">85%</div>
            <div className="text-xs text-gray-500">Close Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
} 