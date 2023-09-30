import { AfterViewInit, Component,HostListener  } from '@angular/core';
import { TradeServiceService } from '../trade-service.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Renderer2, ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements AfterViewInit {
  @ViewChild('strike') strike!: ElementRef;


  private subscription: Subscription | undefined;
  constructor(private traderService: TradeServiceService,private renderer: Renderer2){}
  ngAfterViewInit(): void {
    if (this.strike) {
      this.strike.nativeElement.focus();
    }
  }

  indexOptions: string[] = [];
  indexExpiry: string[] = [];
  indexStrike: number[] = [];
  selectedAccounts: any[] = [];
  accounts = [
    { name: 'Main', selected: true },
    { name: 'Algo', selected: false },
    { name: 'Raj', selected: false },
    // Add more accounts as needed
  ];


  selectedIndex: string = "BANKNIFTY";
  selectedExpiry: string = "";
  selectedStrike: string = "";
  response: string = "";
  quantityFromBackend: number =0;
  inputQuantity: number = 18;
  funds: number =0;
  profitOrLoss: number =0;
  slenabled:boolean=false;


  cancelPendingOrders() {
    this.traderService.cancel_pending_orders().subscribe(
      (data) => {
        this.response = data.message;
      },
      (error) => {
        console.error('Error fetching index options:', error);
      }
    );
   }
  
  setMessageColor(message: string) {
    const color = this.extractColor(message);
    if (color) {
      return { color };
    }
    return {}; // Default style
  }

  extractColor(message: string): string | null {
    const match = message.match(/(RED|GREEN|BLUE):/);
    if (match) {
      return match[1].toLowerCase();
    }
    return null;
  }

  onCheckboxChange(){
    console.log(this.slenabled)
  }

  ngOnInit(){
    this.traderService.index_options().subscribe(
      (data) => {
        this.indexOptions = data;
      },
      (error) => {
        console.error('Error fetching index options:', error);
      }
    );

    this.traderService.index_expiry(this.selectedIndex).subscribe(
      (data) => {
        this.indexExpiry = data;
        this.selectedExpiry = data[0]
      },
      (error) => {
        console.error('Error fetching index options:', error);
      }
    );

    this.traderService.strike_price(this.selectedIndex).subscribe(
      (data) => {
        const numberAsString = Math.trunc(data.candles[0][1]).toString();
        const firstThreeDigits = numberAsString.substring(0, 3) + "00";
        const parsedNumber = parseInt(firstThreeDigits, 10);
        // const roundedCenterValue = Math.round(Math.trunc(data.candles[0][1]) / 100) * 100;
        if(parsedNumber > 30000){
          this.printRange(parsedNumber,1000,100)
        }else{
          this.printRange(parsedNumber,500,50)
        }
        
      },
      (error) => {
        console.error('Error fetching index options:', error);
      }
      );
      this.traderService.available_funds().subscribe(
        (data) => {
          const availableBalanceEntry = data.fund_limit.find((item: { title: string; }) => item.title === 'Available Balance');
        this.funds = availableBalanceEntry ? Math.trunc(availableBalanceEntry.equityAmount) : 0;
        }
      );
      this.traderService.get_positions().subscribe((data: any) => {
      this.profitOrLoss = Math.trunc(data.overall.pl_total);
      });
    this.quantityFromBackend = this.inputQuantity * 15;
    this.alert_closing_time()
  }

  printRange(centerValue: number, range: number, frequency: number) {
    const halfRange = range / 2;
    this.indexStrike = []
    for (let i = -halfRange; i <= halfRange; i += frequency) {
      console.log(frequency)
      const value = centerValue + i;
      this.indexStrike.push(value)
    }
    this.indexStrike.sort((a, b) => b - a);
  }

  generateStrikePrices(centerValue: number, range: number, frequency: number) {
    console.log("Opening Prices:", this.indexStrike);
  }

  updateQuantity(event: any): void {
    if (event.target && event.target.value !== null) {
      const inputValue = parseFloat(event.target.value);
      if (!isNaN(inputValue)) {
        if (this.selectedIndex === "BANKNIFTY"){
          this.quantityFromBackend = this.inputQuantity * 15;
        }else if(this.selectedIndex === "NIFTY50"){
          this.quantityFromBackend = this.inputQuantity * 50;
        } else if(this.selectedIndex === "FINNIFTY"){
          this.quantityFromBackend = this.inputQuantity * 40;
        }
      } else {
        this.quantityFromBackend = 0; // Handle invalid input
      }
    }
  }

  handleButtonClick() {
    // Your button click logic goes here
    console.log('Button clicked!');
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Check for the keyboard shortcut, e.g., Ctrl + B
    if (event.keyCode === 67) {
      this.onCallBuy()
    }
    if (event.keyCode === 80) {
      this.onPutBuy()
    }
    if (event.keyCode === 88) {
      this.onCallSell()
    }
    if (event.keyCode === 79) {
      this.onPutSell()
    }

    if (event.keyCode === 69) {
      this.onExitPositions()
    }
    if (event.keyCode === 90) {
      this.cancelPendingOrders()
    }
    if(event.keyCode === 65){
      this.strike.nativeElement.focus()
    }
  }


  onCallBuy() {
    // Add logic for Call Buy here
    console.log('Call Buy clicked');
    this.traderService.onCallBuy(this.selectedIndex,this.selectedExpiry,this.selectedStrike,'CE',this.quantityFromBackend,1).subscribe(
      (response:any) => {
        console.log('API Response:', response);
        this.response = response.message;
      },
      (error) => {
        console.error('API Error:', error);
        this.response = "Internal Server Error";
      }
    );
    this.subscription = interval(1000)
    .pipe(
      switchMap(() => this.traderService.get_positions())
    )
    .subscribe((data: any) => {
      this.profitOrLoss = Math.trunc(data.overall.pl_total);
      if(this.profitOrLoss < -2000 && this.slenabled){
        this.onExitPositions()
      }
    });
  }

  onCallSell() {
    // Add logic for Call Buy here
    console.log('Call Buy clicked');
    this.traderService.onCallBuy(this.selectedIndex,this.selectedExpiry,this.selectedStrike,'CE',this.quantityFromBackend,-1).subscribe(
      (response:any) => {
        console.log('API Response:', response);
        this.response = response.message;
      },
      (error) => {
        console.error('API Error:', error);
        this.response = "Internal Server Error";
      }
    );
    this.subscription = interval(1000)
    .pipe(
      switchMap(() => this.traderService.get_positions())
    )
    .subscribe((data: any) => {
      this.profitOrLoss = Math.trunc(data.overall.pl_total);
      if(this.profitOrLoss < -2000 && this.slenabled){
        this.onExitPositions()
      }
    });
  
  }

  ngOnDestroy() {
    // Unsubscribe from the interval when the component is destroyed
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onPutBuy() {
    // Add logic for Put Buy here
    console.log('Put Buy clicked');
     // Add logic for Call Buy here
     console.log('Call Buy clicked');
     this.traderService.onCallBuy(this.selectedIndex,this.selectedExpiry,this.selectedStrike,'PE',this.quantityFromBackend,1).subscribe(
       (response:any) => {
         console.log('API Response:', response);
         this.response = response.message;
       },
       (error) => {
         console.error('API Error:', error);
         this.response = "Internal Server Error";
       }
     );
  
  }

  onPutSell() {
    // Add logic for Put Buy here
    console.log('Put Buy clicked');
     // Add logic for Call Buy here
     console.log('Call Buy clicked');
     this.traderService.onCallBuy(this.selectedIndex,this.selectedExpiry,this.selectedStrike,'PE',this.quantityFromBackend,-1).subscribe(
       (response:any) => {
         console.log('API Response:', response);
         this.response = response.message;
       },
       (error) => {
         console.error('API Error:', error);
         this.response = "Internal Server Error";
       }
     );
    
  }

  onExitPositions() {
    // Add logic for Exit All Positions here
    console.log('Exit All Positions clicked');
    this.traderService.exit_all_positions().subscribe(
      (response:any) => {
        console.log('API Response:', response);
        this.response = response.message;
      },
      (error) => {
        console.error('API Error:', error);
        this.response = "Internal Server Error";
      }
    );
    this.ngOnDestroy()
  }

  onIndexSelection(){
    this.traderService.index_expiry(this.selectedIndex).subscribe(
      (data) => {
        this.indexExpiry = data;
        this.selectedExpiry = data[0]
      },
      (error) => {
        console.error('Error fetching index options:', error);
      }
    );

    this.traderService.strike_price(this.selectedIndex).subscribe(
      (data) => {
        const numberAsString = Math.trunc(data.candles[0][1]).toString();
        const firstThreeDigits = numberAsString.substring(0, 3) + "00";
        const parsedNumber = parseInt(firstThreeDigits, 10);
        // const roundedCenterValue = Math.round(Math.trunc(data.candles[0][1]) / 100) * 100;
        if(parsedNumber > 30000){
          this.printRange(parsedNumber,1000,100)
        }else{
          this.printRange(parsedNumber,500,50)
        }
        
      },
      (error) => {
        console.error('Error fetching index options:', error);
      }
      );

      if (this.selectedIndex === "BANKNIFTY"){
        this.quantityFromBackend = this.inputQuantity * 15;
      }else if(this.selectedIndex === "NIFTY50"){
        this.quantityFromBackend = this.inputQuantity * 50;
      } else if(this.selectedIndex === "FINNIFTY"){
        this.quantityFromBackend = this.inputQuantity * 40;
      }

  }

  alert_closing_time() {
    // Get the current date and time
    const now = new Date();

    // Calculate the time until the next 3:05 PM
    const nextAlertTime = new Date(now);
    nextAlertTime.setHours(15, 5, 0, 0); // Set to 3:05 PM today

    if (nextAlertTime < now) {
      // If the calculated time is in the past, set it to tomorrow
      nextAlertTime.setDate(nextAlertTime.getDate() + 1);
    }

    // Calculate the time difference in milliseconds
    const timeUntilNextAlert = nextAlertTime.getTime() - now.getTime();

    // Set a setTimeout to trigger an alert at the calculated time
    setTimeout(() => {
      alert('Closing Time - all intraday alerts will reject.');
    }, timeUntilNextAlert);
  }

}
