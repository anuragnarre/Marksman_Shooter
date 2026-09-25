"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Crosshair, Wrench, Settings } from 'lucide-react';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/equipment', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setEquipment(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Armory & Equipment</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">Add New Weapon</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map(item => (
          <Card key={item.id} className="dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">{item.name}</CardTitle>
              <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>{item.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Make:</strong> {item.make || 'N/A'}</p>
                <p><strong>Model:</strong> {item.model || 'N/A'}</p>
                <p><strong>Caliber:</strong> {item.caliber || 'N/A'}</p>
                <p><strong>Serial:</strong> {item.serialNumber || 'N/A'}</p>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">Rounds Fired</span>
                  <span className="text-lg font-bold text-blue-500">{item.roundCount}</span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (item.roundCount / 5000) * 100)}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Service due at 5000 rounds</p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1"><Wrench className="w-4 h-4 mr-2"/> Service</Button>
                <Button variant="outline" size="sm" className="flex-1"><Settings className="w-4 h-4 mr-2"/> Optics</Button>
                <Button variant="outline" size="sm" className="flex-1"><Crosshair className="w-4 h-4 mr-2"/> Ballistics</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {equipment.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700">
            <ShieldAlert className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Equipment Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Add your first firearm or optic to start tracking rounds and service history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
