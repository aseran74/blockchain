import { Component, OnInit, signal, computed, inject, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseDataService } from '../../core/supabase-data.service';
import { Subject } from 'rxjs';
import { switchMap, catchError, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

type CertificateType = 'ISO' | 'origen' | 'inspeccion';
type CertificateStatus = 'caducado' | 'no_pagado' | 'fallido' | 'aprobado';

interface Certificate {
  id: string;
  certificate_type_new: CertificateType;
  certificate_name: string;
  certificate_number: string;
  issuing_body_name: string | null;
  blockchain_name: string | null;
  certificate_status: CertificateStatus;
  issue_date: string;
  expiry_date: string | null;
  payment_status: string;
  certification_passed: boolean;
  blockchain_hash: string | null;
  block_number: number | null;
  is_valid: boolean;
  verified: boolean;
}

interface Company {
  company_id: string;
  company_name: string;
  company_tax_id: string;
  company_city: string;
  total_certificates: number;
  approved_certificates: number;
  expired_certificates: number;
  unpaid_certificates: number;
  failed_certificates: number;
}

interface IssuingBody {
  id: string;
  name: string;
  blockchain_name: string;
  blockchain_hash: string | null;
  description: string | null;
  country: string;
}

interface BlockchainStats {
  total_blocks: number;
  total_certificates: number;
  min_block: number;
  max_block: number;
  unique_hashes: number;
  status_distribution: Array<{
    status: string;
    count: number;
    blocks: number;
  }>;
}

interface RecentBlock {
  block_number: number;
  certificates_count: number;
  companies_count: number;
  certificate_types: string[];
  first_hash: string | null;
  last_hash: string | null;
  first_timestamp: string;
  last_timestamp: string;
}

@Component({
  selector: 'app-smart-contracts-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './smart-contracts-simulation.component.html',
  styleUrl: './smart-contracts-simulation.component.css'
})
export class SmartContractsSimulationComponent implements OnInit {
  private readonly supabase = inject(SupabaseDataService);
  private refreshTrigger = new Subject<void>();
  
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly searchCompany = signal<string>('');
  readonly selectedCompanyId = signal<string | null>(null);
  readonly selectedStatusFilter = signal<CertificateStatus | 'all'>('all');

  // Cargar empresas con certificados
  private readonly companies$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() =>
      this.supabase.getCompaniesWithCertificates().pipe(
        catchError(() => of([] as Company[]))
      )
    )
  );

  readonly companies = toSignal(this.companies$, { initialValue: [] as Company[] }) as WritableSignal<Company[]>;

  // Cargar organismo emisor
  private readonly issuingBodies$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() =>
      this.supabase.getIssuingBodies().pipe(
        catchError(() => of([] as IssuingBody[]))
      )
    )
  );

  readonly issuingBodies = toSignal(this.issuingBodies$, { initialValue: [] as IssuingBody[] }) as WritableSignal<IssuingBody[]>;

  // Cargar certificados de la empresa seleccionada
  private readonly certificates$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() => {
      const companyId = this.selectedCompanyId();
      if (!companyId) return of([] as Certificate[]);
      return this.supabase.getCompanyCertificates(companyId).pipe(
        catchError(() => of([] as Certificate[]))
      );
    })
  );

  readonly certificates = toSignal(this.certificates$, { initialValue: [] as Certificate[] }) as WritableSignal<Certificate[]>;

  // Cargar estadísticas de blockchain
  private readonly blockchainStats$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() =>
      this.supabase.getBlockchainStats().pipe(
        catchError(() => of({} as BlockchainStats))
      )
    )
  );

  readonly blockchainStats = toSignal(this.blockchainStats$, { initialValue: {} as BlockchainStats }) as WritableSignal<BlockchainStats>;

  // Cargar bloques recientes
  private readonly recentBlocks$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() =>
      this.supabase.getRecentBlocks(10).pipe(
        catchError(() => of([] as RecentBlock[]))
      )
    )
  );

  readonly recentBlocks = toSignal(this.recentBlocks$, { initialValue: [] as RecentBlock[] }) as WritableSignal<RecentBlock[]>;

  readonly filteredCompanies = computed(() => {
    const search = this.searchCompany().toLowerCase().trim();
    const companies = this.companies();
    if (!search) return companies;
    return companies.filter(c => 
      c.company_name.toLowerCase().includes(search) ||
      c.company_tax_id.toLowerCase().includes(search) ||
      c.company_city.toLowerCase().includes(search)
    );
  });

  readonly selectedCompany = computed(() => {
    const id = this.selectedCompanyId();
    if (!id) return null;
    return this.companies().find(c => c.company_id === id) || null;
  });

  readonly filteredCertificates = computed(() => {
    const certs = this.certificates();
    const statusFilter = this.selectedStatusFilter();
    if (statusFilter === 'all') return certs;
    return certs.filter(c => c.certificate_status === statusFilter);
  });

  readonly totalCompanies = computed(() => this.companies().length);
  
  readonly totalCertificates = computed(() => {
    return this.companies().reduce((sum, c) => sum + c.total_certificates, 0);
  });

  readonly totalApproved = computed(() => {
    return this.companies().reduce((sum, c) => sum + c.approved_certificates, 0);
  });

  readonly totalExpired = computed(() => {
    return this.companies().reduce((sum, c) => sum + c.expired_certificates, 0);
  });

  readonly totalUnpaid = computed(() => {
    return this.companies().reduce((sum, c) => sum + c.unpaid_certificates, 0);
  });

  readonly totalFailed = computed(() => {
    return this.companies().reduce((sum, c) => sum + c.failed_certificates, 0);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.refreshTrigger.next();
  }

  // Seleccionar empresa
  selectCompany(companyId: string): void {
    if (this.selectedCompanyId() === companyId) {
      this.selectedCompanyId.set(null);
    } else {
      this.selectedCompanyId.set(companyId);
      this.loadData(); // Recargar certificados
    }
  }

  // Actualizar estado de certificado
  async updateCertificateStatus(
    certificateId: string,
    newStatus: CertificateStatus,
    event?: Event
  ): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.updateCertificateStatus(certificateId, newStatus).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      const resultObj = result as any;
      if (resultObj.success === false || resultObj.error) {
        const errorMsg = resultObj.error || 'Error desconocido al actualizar';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (resultObj.success) {
        alert(`✓ Estado actualizado correctamente\nNuevo estado: ${newStatus}`);
        this.loadData();
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al actualizar estado';
      this.error.set(errorMsg);
      console.error('Error al actualizar estado:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Helpers para clases CSS
  getStatusClasses(status: CertificateStatus): string {
    switch (status) {
      case 'aprobado':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'caducado':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'no_pagado':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'fallido':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  }

  getStatusTextClasses(status: CertificateStatus): string {
    switch (status) {
      case 'aprobado':
        return 'text-green-900 dark:text-green-200';
      case 'caducado':
        return 'text-orange-900 dark:text-orange-200';
      case 'no_pagado':
        return 'text-yellow-900 dark:text-yellow-200';
      case 'fallido':
        return 'text-red-900 dark:text-red-200';
      default:
        return 'text-gray-900 dark:text-white';
    }
  }

  getStatusBadgeClasses(status: CertificateStatus): string {
    switch (status) {
      case 'aprobado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'caducado':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'no_pagado':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'fallido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  }

  getCertificateTypeLabel(type: CertificateType): string {
    switch (type) {
      case 'ISO':
        return 'ISO';
      case 'origen':
        return 'Origen';
      case 'inspeccion':
        return 'Inspección';
      default:
        return type;
    }
  }

  getStatusLabel(status: CertificateStatus): string {
    switch (status) {
      case 'aprobado':
        return 'Aprobado';
      case 'caducado':
        return 'Caducado';
      case 'no_pagado':
        return 'No Pagado';
      case 'fallido':
        return 'Fallido';
      default:
        return status;
    }
  }
}
