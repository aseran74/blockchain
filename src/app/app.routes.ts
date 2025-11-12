import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { OverviewComponent } from './pages/dashboard/overview/overview.component';
import { BlockGroupsComponent } from './pages/block-groups/block-groups.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { NodesComponent } from './pages/nodes/nodes.component';
import { GovernanceComponent } from './pages/governance/governance.component';
import { ParametersComponent } from './pages/parameters/parameters.component';
import { GlobalTpsComponent } from './pages/insights/global-tps/global-tps.component';
import { WalletsComponent } from './pages/wallets/wallets.component';
import { HomeComponent } from './pages/home/home.component';

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
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Iniciar sesión | Votalia'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Crear cuenta | Votalia'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'No encontrado | Votalia'
  },
];
