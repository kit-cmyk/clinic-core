import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PortalDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">My Health Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-foreground">March 22, 2026</p>
            <p className="text-sm text-muted-foreground">Dr. Sarah Kim — Consultation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">2</p>
            <p className="text-sm text-muted-foreground">prescriptions active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">1</p>
            <p className="text-sm text-muted-foreground">result available</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/portal/appointments">View Appointments</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/portal/results">View Results</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/portal/prescriptions">View Prescriptions</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/portal/upload">Upload Document</Link>
        </Button>
      </div>
    </div>
  )
}
