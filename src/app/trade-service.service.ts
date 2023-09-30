import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class TradeServiceService {


  orderIdsWithStatus6:any;

  get_positions(): any {
    const apiEndpoint = `${environment.apiUrl}/positions`;
    return this.http.get<any>(apiEndpoint)
  }
  
  
  constructor(private http: HttpClient) { }

  onCallBuy(selectedIndex: string,selectedExpiry: string,selectedStrike: string,optionType:string,quantity: number,buyOrSell:number) {
    const apiEndpoint = `${environment.apiUrl}/call-buy`;
    if(selectedIndex === "NIFTY50"){
      selectedIndex = "NIFTY"
    }
    // You can pass any data you need to the API in the request body.
    // For example, you can create an object with the selected values.
    const requestData = {
      index: selectedIndex,
      expiry: selectedExpiry,
      strike: selectedStrike,
      optionType:optionType,
      quantity: quantity,
      buyOrSell:buyOrSell
    };

    // Send a POST request to the API
    return this.http.post(apiEndpoint, requestData)
  }

  index_options(){
    const apiEndpoint = `${environment.apiUrl}/index-options`;
    return this.http.get<string[]>(apiEndpoint)
  }

  index_expiry(selectedIndex: string){
    const apiEndpoint = `${environment.apiUrl}/index-expiry`;
    const requestData = {
      index: selectedIndex
    };
    return this.http.post<string[]>(apiEndpoint,requestData)
  }

  strike_price(selectedIndex: string){
    const apiEndpoint = `${environment.apiUrl}/index-strike`;
    const requestData = {
      index: selectedIndex,
    }; 
    return this.http.post<any>(apiEndpoint,requestData)
  }

  exit_all_positions(){
    const apiEndpoint = `${environment.apiUrl}/exit_all_positions`;
    return this.http.post(apiEndpoint,'')
  }

  quantity(){
    const apiEndpoint = `${environment.apiUrl}/quantity`;
    return this.http.get<number>(apiEndpoint)
  }
  available_funds() {
    const apiEndpoint = `${environment.apiUrl}/funds`;
    return this.http.get<any>(apiEndpoint)
  }


  cancel_pending_orders(){  
    const apiEndpointPendingOrder = `${environment.apiUrl}/get-pending-orders`;
    this.http.get<any>(apiEndpointPendingOrder)
    .pipe(
      map((data) => data.orderBook.filter((item: { status: number; }) => item.status === 6).map((item: { id: string; }) => ({ "id": item.id })))
    )
    .subscribe(filteredData => {
      this.orderIdsWithStatus6 = filteredData;
    });
    console.log(this.orderIdsWithStatus6)
    const apiEndpoint = `${environment.apiUrl}/cancel-pending-orders`;
    return this.http.post<any>(apiEndpoint,this.orderIdsWithStatus6)
  }
}
