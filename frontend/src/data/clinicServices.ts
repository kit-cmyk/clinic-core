export interface ClinicService {
  id: string
  name: string
  category: string
  price: number       // in whole currency units (₱)
  description: string
  isActive: boolean
}

export const INITIAL_SERVICES: ClinicService[] = [
  { id: 's1', name: 'General Consultation',     category: 'Consultation', price: 500,  description: 'Standard outpatient consultation',               isActive: true  },
  { id: 's2', name: 'Follow-up Consultation',   category: 'Consultation', price: 300,  description: 'Follow-up visit within 30 days',                 isActive: true  },
  { id: 's3', name: 'Complete Blood Count',     category: 'Lab',          price: 350,  description: 'CBC with differential',                          isActive: true  },
  { id: 's4', name: 'Urinalysis',               category: 'Lab',          price: 150,  description: 'Routine urinalysis',                             isActive: true  },
  { id: 's5', name: 'Chest X-Ray',              category: 'Imaging',      price: 600,  description: 'PA and lateral view',                            isActive: true  },
  { id: 's6', name: 'ECG',                      category: 'Procedure',    price: 350,  description: '12-lead electrocardiogram',                      isActive: true  },
  { id: 's7', name: 'IV Insertion',             category: 'Nursing',      price: 200,  description: 'Peripheral IV line insertion',                   isActive: true  },
  { id: 's8', name: 'Wound Dressing',           category: 'Nursing',      price: 150,  description: 'Basic wound dressing and cleaning',              isActive: true  },
  { id: 's9', name: 'Blood Sugar Monitoring',   category: 'Lab',          price: 100,  description: 'Random blood glucose test',                      isActive: false },
]
