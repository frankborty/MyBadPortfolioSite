import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Nullable } from 'primeng/ts-helpers';
import { ExpenseTypeLinearChartComponent } from '../../../core/components/charts/expenseTypeLinearChart/expenseTypeLinearChart.component';
import { ExpenseTableComponent } from '../../../core/components/expense/expenseTable/expenseTable.component';
import { ParamConfirmationDialogComponent } from '../../../core/components/param-confirmation-dialog/param-confirmation-dialog.component';
import { Expense, ExpenseToEdit } from '../../../core/interfaces/expense';
import { ExpenseCategory } from '../../../core/interfaces/expenseCategory';
import { ExpenseType } from '../../../core/interfaces/expenseType';
import { ExpenseService } from '../../../core/services/expenseService/expense.service';
import { GlobalUtilityService } from '../../../core/services/utils/global-utility.service';
import { ImportsModule } from '../../../imports';
import { EditExpenseComponent } from '../../../core/components/expense/editExpense/editExpense.component';
import { OperationType } from '../../../core/enum/oprationType';
import { ExpensePieChartPanelComponent } from '../../../core/components/charts/expensePieChart/expensePieChartPanel/expensePieChartPanel.component';

@Component({
  selector: 'app-expenseFilterPage',
  imports: [
    ExpenseTableComponent,
    ImportsModule,
    EditExpenseComponent,
    ParamConfirmationDialogComponent,
    ExpensePieChartPanelComponent,
  ],
  providers: [
    ConfirmationService,
    MessageService,
    ExpenseTypeLinearChartComponent,
  ],
  templateUrl: './expenseFilterPage.component.html',
  styleUrls: ['./expenseFilterPage.component.css'],
})
export class ExpenseFilterPageComponent implements OnInit {
  @ViewChild(ParamConfirmationDialogComponent)  confirmDialog!: ParamConfirmationDialogComponent;
  @ViewChild(EditExpenseComponent) editExpenseDialog!: EditExpenseComponent;
  @ViewChild(ExpenseTableComponent) expenseTable!: ExpenseTableComponent;

  displayAddExpenseDialog: boolean = false;
  displayEditExpenseDialog: boolean = false;
  expenseList: Expense[] = [];

  filteredExpenseList: Expense[] = [];
  selectedYear: Date | Nullable = new Date();
  selectedMonth: Date | Nullable = new Date();
  expenseTypes: ExpenseType[] = [];
  expenseCategories: ExpenseCategory[] = [];

  displayExpenseEditPanel: boolean = false;

  totalMoneySpentString: string = '';

  constructor(
    private expenseService: ExpenseService,
    private globalUtils: GlobalUtilityService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadExpenses();
    this.loadExpenseTypes();
    this.loadExpenseCategories();
  }

  loadExpenses() {
    this.expenseService.getExpenses().subscribe({
      next: (data: any) => {
        data.map((expense: Expense) => {
          expense.date = this.globalUtils.convertStringToDate(expense.date.toString());
        });
        (data as Expense[]).sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());

        this.expenseList = data;
        this.filterExpenses();
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }

  loadExpenseTypes() {
    this.expenseService.getExpenseTypes().subscribe({
      next: (data: any) => {
        this.expenseTypes = data;
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }

  loadExpenseCategories() {
    this.expenseService.getExpenseCategories().subscribe({
      next: (data: any) => {
        this.expenseCategories = data;
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }

  //#region NEW

  showAddExpenseDialog(){
      let defaultExpense : Expense = {
        id: -1,
        description: "",
        amount: 0,
        date: new Date(),
        note: "",
        expenseType : this.expenseTypes[0]
      }
      this.editExpenseDialog.setExpenseToEdit(defaultExpense);
      this.editExpenseDialog.setCurrentOperation(OperationType.ADD);
      this.displayExpenseEditPanel=true;
    }


  showEditExpenseDialog(expense: Expense) {
    this.editExpenseDialog.setExpenseToEdit(expense);
    this.editExpenseDialog.setCurrentOperation(OperationType.EDIT);
    this.displayExpenseEditPanel = true;
  }

  addExpense(expense: Expense) {
    this.displayExpenseEditPanel = false;
    if (expense) {
      let expenseToAdd : ExpenseToEdit = {
        id: -1,
        amount: expense.amount,
        date: this.globalUtils.convertDateToString(expense.date),
        description: expense.description,
        expenseType: expense.expenseType.name,
        note: expense.note
      }
      this.expenseService.addExpense(expenseToAdd).subscribe({
        next: () => {
          this.loadExpenses();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Income aggiunta con successo',
          });
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error,
          });
        },
      });
    }
  }

  editExpense(expense: Expense) {
    this.displayExpenseEditPanel = false;
    if (expense) {
      let expenseToEdit : ExpenseToEdit = {
        id: expense.id,
        amount: expense.amount,
        date: this.globalUtils.convertDateToString(expense.date),
        description: expense.description,
        expenseType: expense.expenseType.name,
        note: expense.note
      }

      this.expenseService.editExpense(expenseToEdit.id, expenseToEdit).subscribe({
        next: () => {
          this.loadExpenses();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Income modificata con successo',
          });
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error,
          });
        },
      });
    }
  }

  deleteExpense(expense: Expense) {
    if (expense) {
      this.confirmDialog
        .confirmDelete(
          'Sei sicuro di cancellare la spesa ' +
            expense.description +
            ' (' +
            expense.amount +
            '€ | ' +
            this.globalUtils.convertDateToItaString(expense.date) +
            ')?'
        )
        .then((confirmed) => {
          if (confirmed) {
            this.expenseService.deleteExpense([expense.id]).subscribe({
              next: () => {
                this.loadExpenses();
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Spesa cancellata con successo',
                });
              },
              error: (error: any) => {
                console.error(error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: error,
                });
              },
            });
          } else {
            this.messageService.add({
              severity: 'info',
              summary: 'Cancelled',
              detail: 'Cancellazione annullata',
            });
          }
        });
    }
  }

  //#endregion

  //#region Filters da gestire
  filterExpenses() {
    if (this.selectedYear) {
      this.filterYear();
      this.filterMonth();
      if (this.selectedMonth) {
        this.selectedMonth = new Date(
          this.selectedMonth.setFullYear(this.selectedYear.getFullYear())
        );
      }
    } else {
      this.filteredExpenseList = this.expenseList;
      this.selectedMonth = null;
    }
    let totalMoneySpent = 0;
    for (let i = 0; i < this.filteredExpenseList.length; i++) {
      totalMoneySpent += this.filteredExpenseList[i].amount;
    }
    this.totalMoneySpentString = totalMoneySpent.toFixed(2) + ' €';
  }

  filterYear() {
    this.filteredExpenseList = this.expenseList.filter(
      (expense: Expense) => {
        if (expense.date instanceof Date) {
          return (
            expense.date.getFullYear() === this.selectedYear?.getFullYear()
          );
        }
        return false;
      }
    );
  }

  filterMonth() {
    if (this.selectedMonth) {
      this.filteredExpenseList = this.filteredExpenseList.filter(
        (expense: Expense) => {
          if (expense.date instanceof Date) {
            return expense.date.getMonth() === this.selectedMonth?.getMonth();
          }
          return false;
        }
      );
    }
  }

  //#endregion
}
