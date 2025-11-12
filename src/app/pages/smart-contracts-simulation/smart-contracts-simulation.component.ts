import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseDataService } from '../../core/supabase-data.service';
import { Subject } from 'rxjs';
import { switchMap, catchError, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

interface Certificate {
  id: string;
  certificate_type: string;
  certificate_name: string;
  certificate_number: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  is_valid: boolean;
  blockchain_hash: string;
  block_number: number;
  verified: boolean;
  verified_at: string | null;
}

interface SmartContract {
  id: string;
  contract_number: string;
  contract_type: string;
  buyer_name: string;
  seller_name: string;
  product_description: string;
  amount: number;
  currency: string;
  contract_date: string;
  delivery_date: string | null;
  status: string;
  blockchain_hash: string;
  block_number: number;
  created_at: string;
  certificates: Certificate[];
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
  readonly searchContract = signal<string>('');
  readonly selectedContractId = signal<string | null>(null);
  readonly validationResults = signal<Map<string, any>>(new Map());

  // Cargar datos desde Supabase
  private readonly data$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() =>
      this.supabase.getSmartContractsWithCertificates().pipe(
        catchError(() => of([]))
      )
    )
  );

  readonly data = toSignal(this.data$, { initialValue: [] });
  readonly contracts = computed(() => {
    const contracts = this.data() as SmartContract[];
    if (!contracts || !Array.isArray(contracts)) return [];
    return contracts;
  });

  readonly filteredContracts = computed(() => {
    const search = this.searchContract().toLowerCase().trim();
    const contracts = this.contracts();
    if (!search) return contracts;
    return contracts.filter(c => 
      c.contract_number.toLowerCase().includes(search) ||
      c.buyer_name.toLowerCase().includes(search) ||
      c.seller_name.toLowerCase().includes(search) ||
      c.contract_type.toLowerCase().includes(search)
    );
  });

  readonly selectedContract = computed(() => {
    const id = this.selectedContractId();
    if (!id) return null;
    return this.contracts().find(c => c.id === id) || null;
  });

  readonly verifiedCertificatesCount = computed(() => {
    const contract = this.selectedContract();
    if (!contract || !contract.certificates) return 0;
    return contract.certificates.filter(c => c.verified).length;
  });

  readonly totalContracts = computed(() => this.contracts().length);
  readonly totalCertificates = computed(() => {
    return this.contracts().reduce((sum, c) => sum + (c.certificates?.length || 0), 0);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.refreshTrigger.next();
  }

  // Inicializar datos base
  async initializeContracts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.initSmartContracts().toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al inicializar';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success) {
        alert(`✓ Contratos inicializados exitosamente\nContratos creados: ${result.contracts_created}\nCertificados creados: ${result.certificates_created}`);
        this.loadData();
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al inicializar';
      this.error.set(errorMsg);
      console.error('Error al inicializar contratos:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Seleccionar contrato
  selectContract(contractId: string): void {
    if (this.selectedContractId() === contractId) {
      this.selectedContractId.set(null);
    } else {
      this.selectedContractId.set(contractId);
    }
  }

  // Validar certificado
  async validateCertificate(certificateId: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.validateCertificate(certificateId).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al validar';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success) {
        // Guardar resultado de validación
        const results = new Map(this.validationResults());
        results.set(certificateId, result);
        this.validationResults.set(results);
        
        // Recargar datos para actualizar el estado de verificación
        this.loadData();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mantener la selección del contrato
        const currentContractId = this.selectedContractId();
        if (currentContractId) {
          this.selectedContractId.set(currentContractId);
        }
        
        if (result.is_valid) {
          alert(`✓ Certificado válido\n${result.message}`);
        } else {
          alert(`⚠️ Certificado inválido\n${result.message}`);
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al validar certificado';
      this.error.set(errorMsg);
      console.error('Error al validar certificado:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Helper para obtener clases de validación
  getValidationClasses(isValid: boolean | null): string {
    if (isValid === null) {
      return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
    if (isValid) {
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
    }
    return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
  }

  getValidationTextClasses(isValid: boolean | null): string {
    if (isValid === null) {
      return 'text-gray-900 dark:text-white';
    }
    if (isValid) {
      return 'text-green-900 dark:text-green-200';
    }
    return 'text-red-900 dark:text-red-200';
  }

  getVerifiedStatusClasses(isValid: boolean): string {
    if (isValid) {
      return 'rounded-lg px-3 py-2 text-center text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    }
    return 'rounded-lg px-3 py-2 text-center text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
  }
}
