import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseDataService } from '../../core/supabase-data.service';
import { Subject } from 'rxjs';
import { switchMap, catchError, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';

interface PollingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface Voter {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  direccion: string;
  polling_station_id: string | null;
  latitude: number | null;
  longitude: number | null;
  registered: boolean;
  voted: boolean;
  vote_party: string | null;
  vote_method: 'online' | 'presential' | null;
  sms_code: string;
  vote_hash: string | null;
  block_hash: string | null;
  block_number: number | null;
  status: string;
  user_verified: boolean;
  first_sms_sent: boolean;
  chain_downloaded: boolean;
  second_sms_sent: boolean;
  challenged: boolean;
  audit_match: boolean;
  created_at: string;
  updated_at: string;
  election_polling_stations?: PollingStation | null;
}

@Component({
  selector: 'app-election-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './election-simulation.component.html',
})
export class ElectionSimulationComponent implements OnInit {
  // Helper para obtener clases de verificación
  getVerificationClasses(isCorrect: boolean) {
    if (isCorrect) {
      return 'mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20';
    } else {
      return 'mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20';
    }
  }

  getVerificationTextClasses(isCorrect: boolean) {
    if (isCorrect) {
      return 'font-semibold text-green-900 dark:text-green-200';
    } else {
      return 'font-semibold text-red-900 dark:text-red-200';
    }
  }

  getVerificationStatusClasses(isCorrect: boolean) {
    if (isCorrect) {
      return 'mt-2 text-sm text-green-800 dark:text-green-300';
    } else {
      return 'mt-2 text-sm text-red-800 dark:text-red-300';
    }
  }

  getVerificationMessageClasses(isCorrect: boolean) {
    if (isCorrect) {
      return 'mt-1 text-xs text-green-700 dark:text-green-400';
    } else {
      return 'mt-1 text-xs text-red-700 dark:text-red-400';
    }
  }

  private readonly supabase = inject(SupabaseDataService);
  private refreshTrigger = new Subject<void>();
  
  // Estado
  readonly searchName = signal<string>('');
  readonly selectedVoterId = signal<string | null>(null);
  readonly showCreateForm = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly smsData = signal<any>(null);
  readonly verificationResult = signal<any>(null);
  readonly totalResults = signal<any[] | null>(null);
  readonly randomVotesAssigned = signal<number | null>(null);
  readonly chainDownloadResult = signal<any>(null);

  readonly totalVotesCount = computed(() => {
    const results = this.totalResults();
    if (!results || results.length === 0) return 0;
    return results.reduce((sum, r) => sum + (r.votes || 0), 0);
  });

  readonly votedVoters = computed(() => {
    return this.voters().filter(v => v.voted);
  });

  readonly votersByParty = computed(() => {
    const voters = this.votedVoters();
    const grouped: Record<string, Voter[]> = {};
    voters.forEach(voter => {
      if (voter.vote_party) {
        if (!grouped[voter.vote_party]) {
          grouped[voter.vote_party] = [];
        }
        grouped[voter.vote_party].push(voter);
      }
    });
    return grouped;
  });

  readonly partiesWithVoters = computed(() => {
    const grouped = this.votersByParty();
    return this.parties.filter(party => grouped[party] && grouped[party].length > 0);
  });
  
  // Formulario crear votante
  readonly newVoterNombre = signal<string>('');
  readonly newVoterApellido = signal<string>('');
  readonly newVoterDni = signal<string>('');
  readonly newVoterTelefono = signal<string>('');
  readonly newVoterDireccion = signal<string>('');
  readonly useRandomData = signal<boolean>(true);

  // Cargar datos desde Supabase
  private readonly data$ = this.refreshTrigger.pipe(
    startWith(undefined),
    switchMap(() =>
      forkJoin({
        pollingStations: this.supabase.getPollingStations().pipe(
          catchError(() => of([]))
        ),
        voters: this.supabase.getVoters().pipe(
          catchError(() => of([]))
        )
      })
    )
  );

  readonly data = toSignal(this.data$, { initialValue: { pollingStations: [], voters: [] } });
  readonly pollingStations = computed(() => this.data()?.pollingStations ?? []);
  readonly voters = computed(() => this.data()?.voters ?? []);
  
  readonly filteredVoters = computed(() => {
    const name = this.searchName().toLowerCase().trim();
    if (!name) {
      return this.voters();
    }
    return this.voters().filter(v => 
      v.nombre.toLowerCase().includes(name) || 
      v.apellido.toLowerCase().includes(name) ||
      v.dni.toLowerCase().includes(name)
    );
  });

  readonly selectedVoter = computed(() => {
    const id = this.selectedVoterId();
    if (!id) return null;
    const voters = this.voters();
    if (!voters || voters.length === 0) return null;
    return voters.find(v => v.id === id) || null;
  });

  readonly totalVoters = computed(() => this.voters().length);

  // Partidos disponibles
  readonly parties = ['PSOE', 'PP', 'Podemos', 'Vox', 'PnV'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.refreshTrigger.next();
  }

  // Inicializar datos base
  async initializeBaseData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.supabase.initElectionPollingStations().toPromise();
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.supabase.initElectionVoters().toPromise();
      await new Promise(resolve => setTimeout(resolve, 500));
      this.loadData();
      alert('Datos inicializados: 100 votantes y 10 colegios electorales');
    } catch (err: any) {
      this.error.set(err.message || 'Error al inicializar');
      alert('Error: ' + err.message);
    } finally {
      this.loading.set(false);
    }
  }

  // Seleccionar votante del checklist
  selectVoter(voterId: string): void {
    this.selectedVoterId.set(voterId);
    this.showCreateForm.set(false);
  }

  // Borrar voto de un votante
  async deleteVote(voterId: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm('¿Estás seguro de que deseas borrar el voto de este votante?')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.deleteVote(voterId).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al borrar voto';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success) {
        // Si el votante seleccionado es el que se borró, deseleccionarlo
        if (this.selectedVoterId() === voterId) {
          this.selectedVoterId.set(null);
        }
        this.loadData();
        await new Promise(resolve => setTimeout(resolve, 500));
        alert('✓ Voto borrado exitosamente');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al borrar voto';
      this.error.set(errorMsg);
      console.error('Error al borrar voto:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Toggle formulario crear nuevo
  toggleCreateForm(): void {
    this.showCreateForm.set(!this.showCreateForm());
    if (this.showCreateForm()) {
      this.selectedVoterId.set(null);
    }
  }

  // Crear votante con datos aleatorios
  async createVoterWithRandomData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const randomData = await this.supabase.createVoterRandom().toPromise();
      
      if (!randomData) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (randomData.success === false || (randomData as any).error) {
        const errorMsg = (randomData as any).error || 'Error desconocido al crear votante';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (randomData.success && randomData.voter_id) {
        alert(`Votante creado:\n${randomData.nombre} ${randomData.apellido}\nDNI: ${randomData.dni}\nTeléfono: ${randomData.telefono}\nDirección: ${randomData.direccion}`);
        this.loadData();
        await new Promise(resolve => setTimeout(resolve, 500));
        const voter = await this.supabase.getVoterById(randomData.voter_id).toPromise();
        if (voter) {
          this.selectedVoterId.set(randomData.voter_id);
        }
        this.showCreateForm.set(false);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al crear votante';
      this.error.set(errorMsg);
      console.error('Error al crear votante:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Crear votante manualmente
  async createVoterManual(): Promise<void> {
    const nombre = this.newVoterNombre().trim();
    const apellido = this.newVoterApellido().trim();
    const dni = this.newVoterDni().trim();
    const telefono = this.newVoterTelefono().trim();
    const direccion = this.newVoterDireccion().trim();

    if (!nombre || !apellido || !dni || !telefono || !direccion) {
      alert('Completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.createElectionVoter(
        nombre, apellido, dni, telefono, direccion, undefined
      ).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al crear votante';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success && result.voter_id) {
        alert('Votante creado exitosamente');
        this.loadData();
        await new Promise(resolve => setTimeout(resolve, 500));
        const voter = await this.supabase.getVoterById(result.voter_id).toPromise();
        if (voter) {
          this.selectedVoterId.set(result.voter_id);
        }
        this.showCreateForm.set(false);
        this.newVoterNombre.set('');
        this.newVoterApellido.set('');
        this.newVoterDni.set('');
        this.newVoterTelefono.set('');
        this.newVoterDireccion.set('');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al crear votante';
      this.error.set(errorMsg);
      console.error('Error al crear votante:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Fase 2: Registrar voto
  async registerVote(party: string, method: 'online' | 'presential' = 'online'): Promise<void> {
    const voterId = this.selectedVoterId();
    if (!voterId) {
      alert('Selecciona un votante primero');
      return;
    }

    const voter = this.selectedVoter();
    if (!voter) {
      alert('Votante no encontrado');
      return;
    }

    if (voter.voted) {
      alert('Este votante ya ha votado');
      return;
    }

    if (!this.parties.includes(party)) {
      alert('Partido no válido');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.registerVote(voterId, party, method).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al registrar voto';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success && result.vote_hash) {
        alert(`Voto registrado exitosamente\nPartido: ${party}\nMétodo: ${method === 'online' ? 'Online' : 'Presencial'}\nHash: ${result.vote_hash}`);
        // Mantener el ID del votante seleccionado
        const currentVoterId = this.selectedVoterId();
        this.loadData();
        // Esperar a que se carguen los datos y mantener la selección
        await new Promise(resolve => setTimeout(resolve, 800));
        if (currentVoterId) {
          this.selectedVoterId.set(currentVoterId);
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al registrar voto';
      this.error.set(errorMsg);
      console.error('Error al registrar voto:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Fase 3: Enviar SMS simulado con datos encriptados
  async sendSmsPhase3(): Promise<void> {
    const voterId = this.selectedVoterId();
    if (!voterId) {
      alert('Selecciona un votante primero');
      return;
    }

    const voter = this.selectedVoter();
    if (!voter) {
      alert('Votante no encontrado');
      return;
    }

    if (!voter.voted) {
      alert('Este votante aún no ha votado');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.sendSmsPhase3(voterId).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al enviar SMS';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success && result.sms_sent) {
        this.smsData.set(result);
        // Mantener el ID del votante seleccionado
        const currentVoterId = this.selectedVoterId();
        this.loadData();
        // Esperar a que se carguen los datos y mantener la selección
        await new Promise(resolve => setTimeout(resolve, 800));
        if (currentVoterId) {
          this.selectedVoterId.set(currentVoterId);
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al enviar SMS';
      this.error.set(errorMsg);
      console.error('Error al enviar SMS:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Verificar resultado del voto (correcto o incorrecto)
  async verifyVoteResult(isCorrect: boolean): Promise<void> {
    const voterId = this.selectedVoterId();
    if (!voterId) {
      alert('Selecciona un votante primero');
      return;
    }

    const voter = this.selectedVoter();
    if (!voter) {
      alert('Votante no encontrado');
      return;
    }

    if (!voter.voted) {
      alert('Este votante aún no ha votado');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.verifyIndividualResult(voterId, isCorrect).toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al verificar resultado';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success) {
        this.verificationResult.set(result);
        // Mantener el ID del votante seleccionado
        const currentVoterId = this.selectedVoterId();
        this.loadData();
        // Esperar a que se carguen los datos y mantener la selección
        await new Promise(resolve => setTimeout(resolve, 800));
        if (currentVoterId) {
          this.selectedVoterId.set(currentVoterId);
        }
        
        if (isCorrect) {
          alert('✓ Voto verificado como CORRECTO');
        } else {
          alert('⚠️ Voto marcado como INCORRECTO - Se ha registrado un desafío');
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al verificar resultado';
      this.error.set(errorMsg);
      console.error('Error al verificar resultado:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Fase 4: Asignar votos aleatorios y mostrar resultados totales
  async assignRandomVotesAndGetResults(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Primero asignar votos aleatorios
      const assignResult = await this.supabase.assignRandomVotes().toPromise();
      
      if (!assignResult) {
        throw new Error('No se recibió respuesta del servidor al asignar votos');
      }
      
      if (assignResult.success === false || (assignResult as any).error) {
        const errorMsg = (assignResult as any).error || 'Error desconocido al asignar votos';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (assignResult.success && assignResult.votes_assigned !== undefined) {
        this.randomVotesAssigned.set(assignResult.votes_assigned);
        this.loadData();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Luego obtener los resultados totales
        await new Promise(resolve => setTimeout(resolve, 300));
        const results = await this.supabase.getTotalResults().toPromise();
        
        if (!results) {
          throw new Error('No se recibió respuesta del servidor al obtener resultados');
        }
        
        // getTotalResults devuelve directamente un array JSON
        if (Array.isArray(results)) {
          this.totalResults.set(results);
          const totalVotes = results.reduce((sum: number, r: any) => sum + (r.votes || 0), 0);
          alert(`Votos aleatorios asignados: ${assignResult.votes_assigned}\nTotal de votos: ${totalVotes}`);
        } else if (results && typeof results === 'object' && 'success' in results) {
          // Si viene envuelto en un objeto con success
          const wrappedResults = (results as any).data || results;
          if (Array.isArray(wrappedResults)) {
            this.totalResults.set(wrappedResults);
            const totalVotes = wrappedResults.reduce((sum: number, r: any) => sum + (r.votes || 0), 0);
            alert(`Votos aleatorios asignados: ${assignResult.votes_assigned}\nTotal de votos: ${totalVotes}`);
          } else {
            throw new Error('Formato de resultados inválido');
          }
        } else {
          throw new Error('Formato de resultados inválido');
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al asignar votos aleatorios';
      this.error.set(errorMsg);
      console.error('Error al asignar votos aleatorios:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Fase 5: Descargar cadena de bloques
  async downloadBlockchainChain(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.supabase.downloadBlockchainChain().toPromise();
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      if (result.success === false || (result as any).error) {
        const errorMsg = (result as any).error || 'Error desconocido al descargar cadena';
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      if (result.success && result.chain_downloaded !== undefined) {
        this.chainDownloadResult.set(result);
        this.loadData();
        await new Promise(resolve => setTimeout(resolve, 500));
        alert(`✓ Cadena de bloques descargada exitosamente\nVotos procesados: ${result.chain_downloaded}\nNúmero de bloque: ${result.block_number}`);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.message || 'Error al descargar cadena';
      this.error.set(errorMsg);
      console.error('Error al descargar cadena:', err);
      alert('Error: ' + errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  // Descargar archivo JSON con todos los votantes
  downloadVotersFile(): void {
    const voters = this.voters();
    if (!voters || voters.length === 0) {
      alert('No hay votantes para descargar');
      return;
    }

    // Preparar los datos para el archivo
    const fileData = {
      metadata: {
        total_voters: voters.length,
        download_date: new Date().toISOString(),
        block_number: this.chainDownloadResult()?.block_number || null,
        description: 'Cadena de bloques completa - Datos de todos los votantes'
      },
      voters: voters.map(voter => ({
        id: voter.id,
        nombre: voter.nombre,
        apellido: voter.apellido,
        dni: voter.dni,
        telefono: voter.telefono,
        direccion: voter.direccion,
        polling_station_id: voter.polling_station_id,
        polling_station_name: voter.election_polling_stations?.name || null,
        polling_station_city: voter.election_polling_stations?.city || null,
        latitude: voter.latitude,
        longitude: voter.longitude,
        registered: voter.registered,
        voted: voter.voted,
        vote_party: voter.vote_party,
        vote_method: voter.vote_method,
        sms_code: voter.sms_code,
        vote_hash: voter.vote_hash,
        block_hash: voter.block_hash,
        block_number: voter.block_number,
        status: voter.status,
        user_verified: voter.user_verified,
        first_sms_sent: voter.first_sms_sent,
        chain_downloaded: voter.chain_downloaded,
        second_sms_sent: voter.second_sms_sent,
        challenged: voter.challenged,
        audit_match: voter.audit_match,
        created_at: voter.created_at,
        updated_at: voter.updated_at
      }))
    };

    // Convertir a JSON
    const jsonString = JSON.stringify(fileData, null, 2);
    
    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cadena-bloques-votantes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert(`✓ Archivo descargado exitosamente\nTotal de votantes: ${voters.length}`);
  }
}

