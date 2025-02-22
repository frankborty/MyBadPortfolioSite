import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ImportsModule } from '../../../../imports';
import {
  AssetCategory,
  AssetValueList,
  AssetValueSummary,
} from '../../../interfaces/assetValueSummary';
import { AssetServiceService } from '../../../services/assetService/assetService.service';
import { GlobalUtilityService } from '../../../services/utils/global-utility.service';

interface ValueBydate {
  date: Date;
  value: number;
}

@Component({
  selector: 'app-assetTotalBarChart',
  imports: [ImportsModule],
  templateUrl: './assetTotalBarChart.component.html',
  styleUrls: ['./assetTotalBarChart.component.css'],
})
export class AssetTotalBarChartComponent implements OnInit {
  assetValueSummaryOriginal: AssetValueSummary[] = [];
  assetValueSummaryFiltered: AssetValueSummary[] = [];
  assetCategoryValueDictionary = new Map<string, Map<string, number>>();

  inputData: any;
  options: any;
  selectedYear: Date = new Date('2024-01-01');

  constructor(
    private cd: ChangeDetectorRef,
    private assetService: AssetServiceService,
    private globalUtilityService: GlobalUtilityService
  ) {}

  ngOnInit() {
    this.loadAssetsSummaryByMonth();
  }

  loadAssetsSummaryByMonth() {
    this.assetService.getAssetsSummaryByMonth().subscribe({
      next: (data: AssetValueSummary[]) => {
        this.assetValueSummaryOriginal = data;
        this.initChart();
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }

  initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue(
      '--p-text-muted-color'
    );
    const surfaceBorder = documentStyle.getPropertyValue(
      '--p-content-border-color'
    );

    this.filterAssetValueSummary();

    for (const [categoryName, assetValueByDate] of this
      .assetCategoryValueDictionary) {
      this.inputData = {
        labels: Array.from(assetValueByDate.keys()).map(
          (x) => x.substring(4, 6) + '/' + x.substring(0, 4)
        ),
        datasets: [],
      };
      break;
    }

    for (const [categoryName, assetValueByDate] of this
      .assetCategoryValueDictionary) {
      let dataset = {
        type: 'bar',
        label: categoryName,
        data: Array.from(assetValueByDate.values()),
      };
      this.inputData.datasets.push(dataset);
    }

    let dataset = {
      type: 'line',
      borderWidth: 2,
      fill: false,
      tension: 0.5,
      label: 'Total',
      data: this.getTotalByDate(),
    };
    this.inputData.datasets.push(dataset);

    this.options = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        title: {
          display: true, // Mostra il titolo
          text: 'Income', // Testo del titolo
          font: {
            size: 18, // Dimensione del carattere
            weight: 'bold', // Spessore del carattere
          },
          color: 'rgba(0, 0, 0, 0.8)', // Colore del titolo
          align: 'center', // Allineamento: può essere 'start', 'center', o 'end'
          padding: {
            top: 10,
            bottom: 5,
          },
        },
        subtitle: {
          //text: 'Total: '+incomeTotal.toLocaleString("it-IT", {
          //   minimumFractionDigits: 2,
          //  maximumFractionDigits: 2
          //})+" €",
          display: true,
          padding: {
            top: 0,
            bottom: 0,
          },
        },
        labels: {
          color: textColor,
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };
    this.cd.markForCheck();
  }

  filterAssetValueSummary() {
    this.assetCategoryValueDictionary.clear();
    this.assetValueSummaryOriginal.forEach((assetSummary) => {
      const categoryName = assetSummary.asset.assetCategory.name;
      if (!this.assetCategoryValueDictionary.has(categoryName)) {
        this.assetCategoryValueDictionary.set(
          categoryName,
          new Map<string, number>()
        );
      }
      assetSummary.assetValueList.forEach((assetValue) => {
        const assetCategoryItem =
          this.assetCategoryValueDictionary.get(categoryName);

        this.addNewValueToCategory(assetCategoryItem, assetValue);
      });
    });
  }
  addNewValueToCategory(
    assetCategoryItem: Map<string, number> | undefined,
    assetValue: AssetValueList
  ) {
    if (assetCategoryItem === undefined) {
      return;
    }

    if (this.selectedYear) {
      const assetDateTmp = this.globalUtilityService.convertStringToDate(
        assetValue.timeStamp
      );
      if (assetDateTmp.getFullYear() !== this.selectedYear.getFullYear()) {
        return;
      }
    }

    const assetDate = this.globalUtilityService.convertStringToYearMonthString(
      assetValue.timeStamp
    );

    const currentValue = assetCategoryItem.get(assetDate) ?? 0;
    assetCategoryItem.set(assetDate, currentValue + assetValue.value);
  }

  getTotalByDate(): number[] {
    const totalByDate = new Map<string, number>();
    this.assetValueSummaryOriginal.forEach((assetSummary) => {
      assetSummary.assetValueList.forEach((assetValue) => {
        if (this.selectedYear) {
          const assetDateTmp = this.globalUtilityService.convertStringToDate(
            assetValue.timeStamp
          );
          if (assetDateTmp.getFullYear() !== this.selectedYear.getFullYear()) {
            return;
          }
        }
        const assetDate = this.globalUtilityService.convertStringToYearMonthString(assetValue.timeStamp);
        totalByDate.set(
          assetDate,
          (totalByDate.get(assetDate) ?? 0) + assetValue.value
        );
      });
    });
    return Array.from(totalByDate.values());
  }
}
