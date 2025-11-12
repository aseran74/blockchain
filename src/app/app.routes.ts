import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { OverviewComponent } from './pages/dashboard/overview/overview.component';
import { BlockGroupsComponent } from './pages/block-groups/block-groups.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { NodesComponent } from './pages/nodes/nodes.component';
import { GovernanceComponent } from './pages/governance/governance.component';
import { ParametersComponent } from './pages/parameters/parameters.component';
import { GlobalTpsComponent } from './pages/insights/global-tps/global-tps.component';
import { WalletsComponent } from './pages/wallets/wallets.component';
import { HomeComponent } from './pages/home/home.component';
import { SolarSimulationComponent } from './pages/solar-simulation/solar-simulation.component';
import { NotarySimulationComponent } from './pages/notary-simulation/notary-simulation.component';
import { ElectionSimulationComponent } from './pages/election-simulation/election-simulation.component';
import { SmartContractsSimulationComponent } from './pages/smart-contracts-simulation/smart-contracts-simulation.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    title: 'Votalia | Plataforma PnV',
  },
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: OverviewComponent,
        title: 'Votalia | Panel operativo PnV',
      },
      {
        path: 'block-groups',
        component: BlockGroupsComponent,
        title: 'Grupos de bloques | Votalia',
      },
      {
        path: 'transactions',
        component: TransactionsComponent,
        title: 'Transacciones | Votalia',
      },
      {
        path: 'nodes',
        component: NodesComponent,
        title: 'Nodos y roles | Votalia',
      },
      {
        path: 'governance',
        component: GovernanceComponent,
        title: 'Gobernanza | Votalia',
      },
      {
        path: 'parameters',
        component: ParametersComponent,
        title: 'Parámetros de consenso | Votalia',
      },
      {
        path: 'wallets',
        component: WalletsComponent,
        title: 'Wallet Votalia | Demo',
      },
      {
        path: 'global-tps',
        component: GlobalTpsComponent,
        title: 'Proyección TPS mundial | Votalia',
      },
      {
        path: 'solar-simulation',
        component: SolarSimulationComponent,
        title: 'Simulación Paneles Solares | Votalia',
      },
      {
        path: 'notary-simulation',
        component: NotarySimulationComponent,
        title: 'Simulador Notaría y Registro | Votalia',
      },
      {
        path: 'election-simulation',
        component: ElectionSimulationComponent,
        title: 'Simulador Elecciones | Votalia',
      },
      {
        path: 'smart-contracts-simulation',
        component: SmartContractsSimulationComponent,
        title: 'Simulación Smart Contracts | Votalia',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'No encontrado | Votalia'
  },
];
