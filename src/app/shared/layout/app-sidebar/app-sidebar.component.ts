import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { combineLatest, Subscription } from 'rxjs';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  // Main nav items
  navItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.75 6.5C4.75 5.25736 5.75736 4.25 7 4.25H17C18.2426 4.25 19.25 5.25736 19.25 6.5V17.5C19.25 18.7426 18.2426 19.75 17 19.75H7C5.75736 19.75 4.75 18.7426 4.75 17.5V6.5ZM7 5.75C6.58579 5.75 6.25 6.08579 6.25 6.5V8.75H17.75V6.5C17.75 6.08579 17.4142 5.75 17 5.75H7ZM17.75 10.25H6.25V17.5C6.25 17.9142 6.58579 18.25 7 18.25H17C17.4142 18.25 17.75 17.9142 17.75 17.5V10.25Z" fill="currentColor"></path></svg>`,
      name: "Dashboard",
      subItems: [
        { name: "Resumen", path: "/dashboard" },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.25 6.25C4.25 4.59315 5.59315 3.25 7.25 3.25H16.75C18.4069 3.25 19.75 4.59315 19.75 6.25V17.75C19.75 19.4069 18.4069 20.75 16.75 20.75H7.25C5.59315 20.75 4.25 19.4069 4.25 17.75V6.25ZM7.25 4.75C6.42157 4.75 5.75 5.42157 5.75 6.25V8.75H18.25V6.25C18.25 5.42157 17.5784 4.75 16.75 4.75H7.25ZM18.25 10.25H5.75V17.75C5.75 18.5784 6.42157 19.25 7.25 19.25H16.75C17.5784 19.25 18.25 18.5784 18.25 17.75V10.25Z" fill="currentColor"></path><path d="M8.5 12.75C8.08579 12.75 7.75 13.0858 7.75 13.5C7.75 13.9142 8.08579 14.25 8.5 14.25H15.5C15.9142 14.25 16.25 13.9142 16.25 13.5C16.25 13.0858 15.9142 12.75 15.5 12.75H8.5Z" fill="currentColor"></path><path d="M8.5 15.75C8.08579 15.75 7.75 16.0858 7.75 16.5C7.75 16.9142 8.08579 17.25 8.5 17.25H13C13.4142 17.25 13.75 16.9142 13.75 16.5C13.75 16.0858 13.4142 15.75 13 15.75H8.5Z" fill="currentColor"></path></svg>`,
      name: "Cadena",
      subItems: [
        { name: "Grupos de bloques", path: "/block-groups" },
        { name: "Transacciones", path: "/transactions" },
        { name: "Proyección TPS global", path: "/global-tps" },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.75 4.75C10.75 3.50736 11.7574 2.5 13 2.5H18C19.2426 2.5 20.25 3.50736 20.25 4.75V9.75C20.25 10.9926 19.2426 12 18 12H13C11.7574 12 10.75 10.9926 10.75 9.75V4.75ZM13 4C12.5858 4 12.25 4.33579 12.25 4.75V9.75C12.25 10.1642 12.5858 10.5 13 10.5H18C18.4142 10.5 18.75 10.1642 18.75 9.75V4.75C18.75 4.33579 18.4142 4 18 4H13Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 14.25C3.75 13.0074 4.75736 12 6 12H11C12.2426 12 13.25 13.0074 13.25 14.25V19.25C13.25 20.4926 12.2426 21.5 11 21.5H6C4.75736 21.5 3.75 20.4926 3.75 19.25V14.25ZM6 13.5C5.58579 13.5 5.25 13.8358 5.25 14.25V19.25C5.25 19.6642 5.58579 20 6 20H11C11.4142 20 11.75 19.6642 11.75 19.25V14.25C11.75 13.8358 11.4142 13.5 11 13.5H6Z" fill="currentColor"></path><path d="M16.5 13.25C16.0858 13.25 15.75 13.5858 15.75 14C15.75 16.3472 15.0019 17.75 13.25 17.75C12.8358 17.75 12.5 18.0858 12.5 18.5C12.5 18.9142 12.8358 19.25 13.25 19.25C16.0863 19.25 17.25 16.9909 17.25 14C17.25 13.5858 16.9142 13.25 16.5 13.25Z" fill="currentColor"></path></svg>`,
      name: "Operación",
      subItems: [
        { name: "Nodos y roles", path: "/nodes" },
        { name: "Parámetros", path: "/parameters" },
        { name: "Wallet Votalia", path: "/wallets" },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.75C9.37665 3.75 7.25 5.87665 7.25 8.5C7.25 11.1234 9.37665 13.25 12 13.25C14.6234 13.25 16.75 11.1234 16.75 8.5C16.75 5.87665 14.6234 3.75 12 3.75ZM5.75 8.5C5.75 5.04822 8.54822 2.25 12 2.25C15.4518 2.25 18.25 5.04822 18.25 8.5C18.25 11.9518 15.4518 14.75 12 14.75C8.54822 14.75 5.75 11.9518 5.75 8.5Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4.75 19.25C4.75 16.7647 6.76472 14.75 9.25 14.75H14.75C17.2353 14.75 19.25 16.7647 19.25 19.25V20.25C19.25 20.6642 18.9142 21 18.5 21C18.0858 21 17.75 20.6642 17.75 20.25V19.25C17.75 17.5931 16.4069 16.25 14.75 16.25H9.25C7.59315 16.25 6.25 17.5931 6.25 19.25V20.25C6.25 20.6642 5.91421 21 5.5 21C5.08579 21 4.75 20.6642 4.75 20.25V19.25Z" fill="currentColor"></path><path d="M18.5 17.25C18.0858 17.25 17.75 17.5858 17.75 18C17.75 18.5523 18.1977 19 18.75 19C19.3023 19 19.75 18.5523 19.75 18C19.75 17.4477 19.3023 17 18.75 17C18.6642 17 18.5855 17.0106 18.5 17.25Z" fill="currentColor"></path></svg>`,
      name: "Gobernanza",
      path: "/governance",
    },
  ];
  // Others nav items
  othersItems: NavItem[] = [];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Initial load
    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); // Ensure UI updates
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }  

  
}
