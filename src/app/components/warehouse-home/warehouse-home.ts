import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-warehouse-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './warehouse-home.html',
  styleUrl: './warehouse-home.css',
})
export class WarehouseHome {}

