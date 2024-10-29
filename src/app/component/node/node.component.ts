import { Component } from '@angular/core';
import {NodeService} from "../../service/node.service";
import {ToastrService} from "ngx-toastr";
import {Node} from "../../dto/node";
import {NgForOf} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [
    NgForOf,
    RouterLink
  ],
  templateUrl: './node.component.html',
  styleUrl: './node.component.scss'
})
export class NodeComponent {
  nodes: Node[] = [];
  bannerError: string | null = null;
  constructor(
    private service: NodeService,
    private notification: ToastrService
  ) {
  }

  ngOnInit(): void {
    this.reloadNodes();
  }

  reloadNodes() {
    this.service.getAll()
      .subscribe({
        next: data => {
          // Update each node's texture to the correct display format
          this.nodes = data.map(node => ({
            ...node,
            texture: 'data:image/png;base64,' + node.texture
          }));
        },
        error: error => {
          console.error('Error fetching nodes', error);
          this.bannerError = 'Could not fetch nodes: ' + error.message;
          const errorMessage = error.status === 0
            ? 'Is the backend up?'
            : error.message.message;
          this.notification.error(errorMessage, 'Could Not Fetch Nodes');
        }
      });
  }
}
