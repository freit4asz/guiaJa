import { ChangeDetectorRef, Component } from '@angular/core';
import { ApiService } from '../../../core/api.service';
import { apiErrorMessage, TravelPackage } from '../../../core/models';
import { packageImageUrl } from '../../../core/image-assets';

@Component({
  selector: 'app-package-list',
  standalone: false,
  styleUrl: './package-list.css',
  templateUrl: './package-list.html',
})
export class PackageList {
  packages: TravelPackage[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly api: ApiService, private readonly changeDetector: ChangeDetectorRef) {}

  imageFor(item: TravelPackage): string | null {
    return packageImageUrl(item);
  }

  ngOnInit(): void {
    this.api.packages().subscribe({
      next: packages => {
        this.packages = packages;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar os pacotes.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
